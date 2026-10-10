package np.eglesson.engage;

import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;
import np.eglesson.auth.AdminUserRepository;
import np.eglesson.common.ApiException;
import np.eglesson.common.PageResponse;
import np.eglesson.common.Times;
import np.eglesson.config.AuthPrincipal;
import np.eglesson.config.Current;
import np.eglesson.content.Post;
import np.eglesson.content.PostDtos.PostCard;
import np.eglesson.content.PostRepository;
import np.eglesson.content.PostService;
import np.eglesson.engage.EngageDtos.*;
import np.eglesson.quiz.QuizAttemptRepository;
import np.eglesson.settings.SettingsService;
import np.eglesson.student.Student;
import np.eglesson.student.StudentRepository;
import np.eglesson.audit.AuditService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class EngageService {
  private final JdbcTemplate jdbc;
  private final PostRepository posts;
  private final PostService postService;
  private final PostLikeRepository likes;
  private final BookmarkRepository bookmarks;
  private final ReadingHistoryRepository history;
  private final StudentActivityDayRepository activity;
  private final CommentRepository comments;
  private final StudentRepository students;
  private final AdminUserRepository admins;
  private final QuizAttemptRepository attempts;
  private final SettingsService settings;
  private final AuditService audit;

  public EngageService(JdbcTemplate jdbc, PostRepository posts, PostService postService, PostLikeRepository likes,
                       BookmarkRepository bookmarks, ReadingHistoryRepository history,
                       StudentActivityDayRepository activity, CommentRepository comments, StudentRepository students,
                       AdminUserRepository admins, QuizAttemptRepository attempts, SettingsService settings,
                       AuditService audit) {
    this.jdbc = jdbc;
    this.posts = posts;
    this.postService = postService;
    this.likes = likes;
    this.bookmarks = bookmarks;
    this.history = history;
    this.activity = activity;
    this.comments = comments;
    this.students = students;
    this.admins = admins;
    this.attempts = attempts;
    this.settings = settings;
    this.audit = audit;
  }

  private Post livePost(Long postId) {
    Post p = posts.findById(postId).orElseThrow(() -> ApiException.notFound("Post"));
    if (!p.isLive()) throw ApiException.notFound("Post");
    return p;
  }

  // ------------------------------------------------------------------ views, progress, streaks

  /** Called once per reading session by the reader page. Upserts are atomic so parallel readers never collide. */
  @Transactional
  public void recordView(Long postId) {
    livePost(postId);
    posts.incrementViews(postId);
    jdbc.update("INSERT INTO post_view_daily (post_id, view_date, views) VALUES (?, ?, 1) AS n "
        + "ON DUPLICATE KEY UPDATE views = post_view_daily.views + 1", postId, Times.todayNepal());
    Long sid = Current.studentIdOrNull();
    if (sid != null) {
      saveProgress(sid, postId, 0);
      markActive(sid);
    }
  }

  @Transactional
  public void progress(Long postId, int percent) {
    Long sid = Current.student().id();
    livePost(postId);
    saveProgress(sid, postId, Math.max(0, Math.min(100, percent)));
    markActive(sid);
  }

  private void saveProgress(Long sid, Long postId, int percent) {
    jdbc.update("INSERT INTO reading_history (student_id, post_id, progress, last_read_at) VALUES (?, ?, ?, ?) AS n "
            + "ON DUPLICATE KEY UPDATE progress = GREATEST(reading_history.progress, n.progress), last_read_at = n.last_read_at",
        sid, postId, percent, Timestamp.from(Instant.now()));
  }

  public void markActive(Long sid) {
    jdbc.update("INSERT IGNORE INTO student_activity_day (student_id, activity_day) VALUES (?, ?)", sid, Times.todayNepal());
  }

  // ------------------------------------------------------------------ likes & bookmarks

  @Transactional
  public Toggle toggleLike(Long postId) {
    Long sid = Current.student().id();
    livePost(postId);
    boolean nowActive;
    if (likes.remove(sid, postId) > 0) {
      posts.addLikes(postId, -1);
      nowActive = false;
    } else {
      int added = jdbc.update("INSERT IGNORE INTO post_like (student_id, post_id, created_at) VALUES (?, ?, ?)", sid, postId, Timestamp.from(Instant.now()));
      if (added > 0) posts.addLikes(postId, 1);
      nowActive = true;
    }
    Integer count = jdbc.queryForObject("SELECT like_count FROM post WHERE id = ?", Integer.class, postId);
    return new Toggle(nowActive, count == null ? 0 : count);
  }

  @Transactional
  public Toggle toggleBookmark(Long postId) {
    Long sid = Current.student().id();
    livePost(postId);
    boolean nowActive;
    if (bookmarks.remove(sid, postId) > 0) {
      posts.addBookmarks(postId, -1);
      nowActive = false;
    } else {
      int added = jdbc.update("INSERT IGNORE INTO bookmark (student_id, post_id, created_at) VALUES (?, ?, ?)", sid, postId, Timestamp.from(Instant.now()));
      if (added > 0) posts.addBookmarks(postId, 1);
      nowActive = true;
    }
    Integer count = jdbc.queryForObject("SELECT bookmark_count FROM post WHERE id = ?", Integer.class, postId);
    return new Toggle(nowActive, count == null ? 0 : count);
  }

  // ------------------------------------------------------------------ my learning

  @Transactional(readOnly = true)
  public PageResponse<PostCard> myBookmarks(int page, int size) {
    Long sid = Current.student().id();
    Page<Bookmark> b = bookmarks.findByStudentIdOrderByCreatedAtDesc(sid, PageRequest.of(page, Math.min(size, 50)));
    Map<Long, Post> byId = posts.findAllById(b.getContent().stream().map(Bookmark::getPostId).toList()).stream()
        .collect(Collectors.toMap(Post::getId, p -> p));
    List<PostCard> cards = b.getContent().stream().map(x -> byId.get(x.getPostId()))
        .filter(p -> p != null && p.isLive()).map(postService::card).toList();
    return new PageResponse<>(cards, b.getNumber(), b.getSize(), b.getTotalElements(), b.getTotalPages());
  }

  @Transactional(readOnly = true)
  public PageResponse<HistoryItem> myHistory(int page, int size) {
    Long sid = Current.student().id();
    Page<ReadingHistory> h = history.findByStudentIdOrderByLastReadAtDesc(sid, PageRequest.of(page, Math.min(size, 50)));
    Map<Long, Post> byId = posts.findAllById(h.getContent().stream().map(ReadingHistory::getPostId).toList()).stream()
        .collect(Collectors.toMap(Post::getId, p -> p));
    List<HistoryItem> items = h.getContent().stream().filter(x -> byId.containsKey(x.getPostId()) && byId.get(x.getPostId()).isLive())
        .map(x -> new HistoryItem(postService.card(byId.get(x.getPostId())), x.getProgress(), x.getLastReadAt())).toList();
    return new PageResponse<>(items, h.getNumber(), h.getSize(), h.getTotalElements(), h.getTotalPages());
  }

  @Transactional(readOnly = true)
  public LearningStats myStats() {
    Long sid = Current.student().id();
    LocalDate today = Times.todayNepal();
    List<LocalDate> days = activity.daysSince(sid, today.minusDays(370));
    Set<LocalDate> set = new HashSet<>(days);
    // Streak survives until the end of today even if the student hasn't studied yet today.
    LocalDate cursor = set.contains(today) ? today : today.minusDays(1);
    int streak = 0;
    while (set.contains(cursor)) {
      streak++;
      cursor = cursor.minusDays(1);
    }
    int best = 0, run = 0;
    LocalDate prev = null;
    for (LocalDate d : days.stream().sorted().toList()) {
      run = prev != null && prev.plusDays(1).equals(d) ? run + 1 : 1;
      best = Math.max(best, run);
      prev = d;
    }
    Double avg = attempts.averagePercent(sid);
    List<String> recent = days.stream().filter(d -> !d.isBefore(today.minusDays(90))).map(LocalDate::toString).toList();
    return new LearningStats(streak, best, history.countByStudentId(sid), history.countByStudentIdAndProgressGreaterThanEqual(sid, 90),
        bookmarks.countByStudentId(sid), attempts.countByStudentId(sid), avg == null ? null : (int) Math.round(avg), recent);
  }

  // ------------------------------------------------------------------ comments

  @Transactional(readOnly = true)
  public List<CommentView> commentsFor(Long postId) {
    List<Comment> all = comments.findByPostIdAndStatusOrderByCreatedAtAsc(postId, CommentStatus.VISIBLE);
    Map<Long, Student> authors = students.findAllById(all.stream().map(Comment::getStudentId).filter(Objects::nonNull).collect(Collectors.toSet()))
        .stream().collect(Collectors.toMap(Student::getId, s -> s));
    Long me = Current.studentIdOrNull();
    Map<Long, List<CommentView>> replies = new HashMap<>();
    List<CommentView> top = new ArrayList<>();
    // Replies first so parents can attach them.
    for (Comment c : all) {
      if (c.getParentId() != null) replies.computeIfAbsent(c.getParentId(), k -> new ArrayList<>()).add(view(c, authors, me, List.of()));
    }
    for (Comment c : all) {
      if (c.getParentId() == null) top.add(view(c, authors, me, replies.getOrDefault(c.getId(), List.of())));
    }
    Collections.reverse(top); // newest question first, replies stay chronological
    return top;
  }

  private CommentView view(Comment c, Map<Long, Student> authors, Long me, List<CommentView> replies) {
    boolean team = c.getAdminId() != null;
    Student s = c.getStudentId() == null ? null : authors.get(c.getStudentId());
    String name = team ? "eglesson team" : s == null ? "Student" : s.getFullName();
    return new CommentView(c.getId(), c.getParentId(), name, s == null ? null : s.getAvatarColor(), team,
        me != null && me.equals(c.getStudentId()), c.getBody(), c.getStatus().name(), c.getCreatedAt(), replies);
  }

  @Transactional
  public CommentView addComment(Long postId, CommentForm f) {
    AuthPrincipal who = Current.principalOrNull();
    if (who == null) throw ApiException.unauthorized("Please sign in to comment.");
    Post p = livePost(postId);
    if (!p.isAllowComments()) throw ApiException.badRequest("Comments are closed for this post.");
    Comment c = new Comment();
    c.setPostId(postId);
    if (f.parentId() != null) {
      Comment parent = comments.findById(f.parentId()).filter(x -> x.getPostId().equals(postId))
          .orElseThrow(() -> ApiException.badRequest("Reply target not found"));
      // One level of replies keeps threads readable on phones.
      c.setParentId(parent.getParentId() != null ? parent.getParentId() : parent.getId());
    }
    if (who.isAdmin()) {
      c.setAdminId(who.id());
      c.setStatus(CommentStatus.VISIBLE);
    } else {
      c.setStudentId(who.id());
      c.setStatus(settings.flag("comments.autoApprove") ? CommentStatus.VISIBLE : CommentStatus.PENDING);
      markActive(who.id());
    }
    c.setBody(f.body().trim());
    comments.save(c);
    refreshCount(postId);
    Map<Long, Student> authors = c.getStudentId() == null ? Map.of() : Map.of(c.getStudentId(), students.findById(c.getStudentId()).orElseThrow());
    return view(c, authors, c.getStudentId(), List.of());
  }

  @Transactional
  public CommentView adminReply(Long commentId, String body) {
    Comment parent = comments.findById(commentId).orElseThrow(() -> ApiException.notFound("Comment"));
    Comment c = new Comment();
    c.setPostId(parent.getPostId());
    c.setParentId(parent.getParentId() != null ? parent.getParentId() : parent.getId());
    c.setAdminId(Current.admin().id());
    c.setStatus(CommentStatus.VISIBLE);
    c.setBody(body.trim());
    comments.save(c);
    // Replying to a pending question approves it, so the answer isn't orphaned.
    if (parent.getStatus() == CommentStatus.PENDING) parent.setStatus(CommentStatus.VISIBLE);
    refreshCount(c.getPostId());
    audit.log("REPLY", "COMMENT", c.getId(), body.length() > 120 ? body.substring(0, 120) : body);
    return view(c, Map.of(), null, List.of());
  }

  @Transactional
  public void deleteOwnComment(Long id) {
    Long sid = Current.student().id();
    Comment c = comments.findById(id).orElseThrow(() -> ApiException.notFound("Comment"));
    if (!sid.equals(c.getStudentId())) throw ApiException.forbidden("You can only delete your own comments.");
    comments.delete(c);
    refreshCount(c.getPostId());
  }

  private void refreshCount(Long postId) {
    comments.flush();
    posts.setCommentCount(postId, (int) comments.countByPostIdAndStatus(postId, CommentStatus.VISIBLE));
  }

  @Transactional(readOnly = true)
  public PageResponse<CommentRow> adminComments(String status, Long postId, int page, int size) {
    CommentStatus st = status == null || status.isBlank() ? null : CommentStatus.valueOf(status);
    Page<Comment> pg = comments.search(st, postId, PageRequest.of(page, Math.min(size, 100)));
    Set<Long> postIds = pg.getContent().stream().map(Comment::getPostId).collect(Collectors.toSet());
    Map<Long, Post> postMap = posts.findAllById(postIds).stream().collect(Collectors.toMap(Post::getId, p -> p));
    Map<Long, Student> authors = students.findAllById(pg.getContent().stream().map(Comment::getStudentId).filter(Objects::nonNull).collect(Collectors.toSet()))
        .stream().collect(Collectors.toMap(Student::getId, s -> s));
    Map<Long, String> adminNames = new HashMap<>();
    pg.getContent().stream().map(Comment::getAdminId).filter(Objects::nonNull).distinct()
        .forEach(id -> admins.findById(id).ifPresent(a -> adminNames.put(id, a.getFullName())));
    return PageResponse.of(pg, c -> {
      Post p = postMap.get(c.getPostId());
      String author = c.getAdminId() != null ? adminNames.getOrDefault(c.getAdminId(), "Team")
          : Optional.ofNullable(authors.get(c.getStudentId())).map(Student::getFullName).orElse("Student");
      return new CommentRow(c.getId(), c.getPostId(), p == null ? "(deleted)" : p.getTitle(), p == null ? null : p.getSlug(),
          c.getParentId(), author, c.getAdminId() != null, c.getBody(), c.getStatus().name(), c.getCreatedAt());
    });
  }

  @Transactional
  public void moderate(Long id, CommentStatus status) {
    Comment c = comments.findById(id).orElseThrow(() -> ApiException.notFound("Comment"));
    c.setStatus(status);
    refreshCount(c.getPostId());
    audit.log(status.name(), "COMMENT", id, abbreviate(c.getBody()));
  }

  @Transactional
  public void adminDelete(Long id) {
    Comment c = comments.findById(id).orElseThrow(() -> ApiException.notFound("Comment"));
    comments.delete(c);
    refreshCount(c.getPostId());
    audit.log("DELETE", "COMMENT", id, abbreviate(c.getBody()));
  }

  private static String abbreviate(String s) {
    return s == null ? null : s.length() > 120 ? s.substring(0, 120) + "…" : s;
  }
}
