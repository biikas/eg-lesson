package np.eglesson.stats;

import java.sql.Date;
import java.time.Instant;
import java.time.LocalDate;
import java.util.*;
import np.eglesson.audit.AuditLog;
import np.eglesson.audit.AuditLogRepository;
import np.eglesson.catalog.CatalogDtos.TreeNode;
import np.eglesson.catalog.CatalogService;
import np.eglesson.common.Times;
import np.eglesson.content.*;
import np.eglesson.engage.CommentRepository;
import np.eglesson.engage.CommentStatus;
import np.eglesson.engage.StudentActivityDayRepository;
import np.eglesson.request.ContentRequestRepository;
import np.eglesson.student.StudentRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Numbers for the admin dashboard: traffic, growth, the content team's output and what students are missing. */
@Service
public class StatsService {
  public record Point(String date, long value) {}

  public record Named(Long id, String name, String slug, long value) {}

  public record Gap(Long id, String name, String path) {}

  public record Dashboard(Map<String, Long> totals, List<Point> views, List<Point> signups, List<Point> activeStudents,
                          List<Named> topPosts, List<Named> uploadsToday, List<Named> uploadsWeek,
                          List<Named> topSearches, List<Named> zeroResultSearches, long emptySubjectCount,
                          List<Gap> emptySubjects, List<AuditLog> recentActivity) {}

  public record PostStats(List<Point> views) {}

  private final PostRepository posts;
  private final PostViewDailyRepository views;
  private final StudentRepository students;
  private final StudentActivityDayRepository activity;
  private final CommentRepository comments;
  private final ContentRequestRepository requests;
  private final SearchLogRepository searches;
  private final AuditLogRepository auditLogs;
  private final CatalogService catalog;
  private final JdbcTemplate jdbc;

  public StatsService(PostRepository posts, PostViewDailyRepository views, StudentRepository students,
                      StudentActivityDayRepository activity, CommentRepository comments, ContentRequestRepository requests,
                      SearchLogRepository searches, AuditLogRepository auditLogs, CatalogService catalog, JdbcTemplate jdbc) {
    this.posts = posts;
    this.views = views;
    this.students = students;
    this.activity = activity;
    this.comments = comments;
    this.requests = requests;
    this.searches = searches;
    this.auditLogs = auditLogs;
    this.catalog = catalog;
    this.jdbc = jdbc;
  }

  @Transactional(readOnly = true)
  public Dashboard dashboard(int days) {
    days = Math.max(7, Math.min(days, 180));
    LocalDate today = Times.todayNepal();
    LocalDate from = today.minusDays(days - 1L);
    Instant todayStart = Times.startOfDayNepal(today);
    Instant weekStart = Times.startOfDayNepal(today.minusDays(6));

    Map<String, Long> totals = new LinkedHashMap<>();
    totals.put("published", posts.countByStatus(PostStatus.PUBLISHED));
    totals.put("drafts", posts.countByStatus(PostStatus.DRAFT));
    totals.put("inReview", posts.countByStatus(PostStatus.REVIEW));
    totals.put("students", students.count());
    totals.put("newStudentsToday", students.countByCreatedAtAfter(todayStart));
    totals.put("activeToday", activity.activeStudentsOn(today));
    totals.put("viewsTotal", posts.totalViews());
    totals.put("viewsToday", views.totalOn(today));
    totals.put("viewsYesterday", views.totalOn(today.minusDays(1)));
    totals.put("postsToday", posts.createdSince(todayStart));
    totals.put("pendingComments", comments.countByStatus(CommentStatus.PENDING));
    totals.put("commentsToday", comments.countByCreatedAtAfter(todayStart));
    totals.put("openRequests", requests.countByStatus("OPEN"));
    totals.put("searchesToday", searches.countByCreatedAtAfter(todayStart));

    List<Point> viewSeries = fill(from, today, views.dailyTotals(from));
    List<Point> activeSeries = fill(from, today, activity.activeStudentsSince(from));
    // Sign-ups grouped by the Nepal calendar day.
    Map<LocalDate, Long> signupMap = new HashMap<>();
    jdbc.query("SELECT created_at FROM student WHERE created_at >= ?", rs -> {
      LocalDate d = rs.getTimestamp(1).toInstant().atZone(Times.NEPAL).toLocalDate();
      signupMap.merge(d, 1L, Long::sum);
    }, java.sql.Timestamp.from(Times.startOfDayNepal(from)));
    List<Point> signupSeries = new ArrayList<>();
    for (LocalDate d = from; !d.isAfter(today); d = d.plusDays(1)) signupSeries.add(new Point(d.toString(), signupMap.getOrDefault(d, 0L)));

    List<Named> top = new ArrayList<>();
    List<Object[]> topRows = views.topSince(today.minusDays(6), PageRequest.of(0, 10));
    Map<Long, Post> postMap = new HashMap<>();
    posts.findAllById(topRows.stream().map(r -> (Long) r[0]).toList()).forEach(p -> postMap.put(p.getId(), p));
    for (Object[] r : topRows) {
      Post p = postMap.get((Long) r[0]);
      if (p != null) top.add(new Named(p.getId(), p.getTitle(), p.getSlug(), ((Number) r[1]).longValue()));
    }

    List<Named> uploadsToday = posts.createdByAuthorSince(todayStart).stream()
        .map(r -> new Named((Long) r[0], (String) r[1], null, (Long) r[2])).toList();
    List<Named> uploadsWeek = posts.createdByAuthorSince(weekStart).stream()
        .map(r -> new Named((Long) r[0], (String) r[1], null, (Long) r[2])).toList();
    List<Named> topSearches = searches.topTerms(weekStart, PageRequest.of(0, 10)).stream()
        .map(r -> new Named(null, (String) r[0], null, (Long) r[1])).toList();
    List<Named> zero = searches.zeroResultTerms(Times.startOfDayNepal(today.minusDays(29)), PageRequest.of(0, 15)).stream()
        .map(r -> new Named(null, (String) r[0], null, (Long) r[1])).toList();

    // Coverage gaps: leaf categories (usually subjects/chapters) with no live post yet.
    List<Gap> gaps = new ArrayList<>();
    long[] gapCount = {0};
    for (TreeNode root : catalog.tree(false)) collectGaps(root, gaps, gapCount);

    List<AuditLog> recent = auditLogs.findAll(PageRequest.of(0, 12, Sort.by(Sort.Direction.DESC, "createdAt"))).getContent();
    return new Dashboard(totals, viewSeries, signupSeries, activeSeries, top, uploadsToday, uploadsWeek, topSearches,
        zero, gapCount[0], gaps, recent);
  }

  private void collectGaps(TreeNode n, List<Gap> out, long[] count) {
    if (n.children().isEmpty()) {
      if (n.postCount() == 0) {
        count[0]++;
        if (out.size() < 25) out.add(new Gap(n.id(), n.name(), catalog.pathLabel(n.id())));
      }
      return;
    }
    n.children().forEach(c -> collectGaps(c, out, count));
  }

  private static List<Point> fill(LocalDate from, LocalDate to, List<Object[]> rows) {
    Map<LocalDate, Long> m = new HashMap<>();
    for (Object[] r : rows) {
      LocalDate d = r[0] instanceof LocalDate ld ? ld : ((Date) r[0]).toLocalDate();
      m.put(d, ((Number) r[1]).longValue());
    }
    List<Point> out = new ArrayList<>();
    for (LocalDate d = from; !d.isAfter(to); d = d.plusDays(1)) out.add(new Point(d.toString(), m.getOrDefault(d, 0L)));
    return out;
  }

  @Transactional(readOnly = true)
  public PostStats post(Long postId) {
    LocalDate today = Times.todayNepal();
    LocalDate from = today.minusDays(29);
    return new PostStats(fill(from, today, views.forPost(postId, from)));
  }
}
