package np.eglesson.notice;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import np.eglesson.audit.AuditService;
import np.eglesson.common.*;
import np.eglesson.config.Current;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class NoticeService {
  public static final Set<String> CATEGORIES = Set.of("EXAM", "RESULT", "ADMISSION", "SCHOLARSHIP", "GENERAL");

  public record NoticeForm(@NotBlank @Size(max = 255) String title, String body, @NotBlank String category,
                           Boolean important, String attachmentUrl, String attachmentName, Long nodeId,
                           Instant publishAt, Instant expireAt, Boolean active) {}

  public record NoticeView(Long id, String title, String slug, String body, String category, boolean important,
                           String attachmentUrl, String attachmentName, Long nodeId, Instant publishAt,
                           Instant expireAt, boolean active, long viewCount, Instant updatedAt) {}

  private final NoticeRepository repo;
  private final AuditService audit;

  public NoticeService(NoticeRepository repo, AuditService audit) {
    this.repo = repo;
    this.audit = audit;
  }

  static NoticeView view(Notice n, boolean withBody) {
    return new NoticeView(n.getId(), n.getTitle(), n.getSlug(), withBody ? n.getBody() : null, n.getCategory(),
        n.isImportant(), n.getAttachmentUrl(), n.getAttachmentName(), n.getNodeId(), n.getPublishAt(), n.getExpireAt(),
        n.isActive(), n.getViewCount(), n.getUpdatedAt());
  }

  @Transactional(readOnly = true)
  public PageResponse<NoticeView> live(String category, int page, int size) {
    String c = category == null || category.isBlank() ? null : category;
    return PageResponse.of(repo.live(Instant.now(), c, PageRequest.of(Math.max(0, page), Math.min(size, 50))), n -> view(n, false));
  }

  @Transactional(readOnly = true)
  public List<NoticeView> ticker() {
    return repo.ticker(Instant.now(), PageRequest.of(0, 8)).stream().map(n -> view(n, false)).toList();
  }

  @Transactional
  public NoticeView read(String slug) {
    Notice n = repo.findBySlug(slug).orElseThrow(() -> ApiException.notFound("Notice"));
    Instant now = Instant.now();
    boolean live = n.isActive() && !n.getPublishAt().isAfter(now) && (n.getExpireAt() == null || n.getExpireAt().isAfter(now));
    if (!live && (Current.principalOrNull() == null || !Current.principalOrNull().isAdmin())) throw ApiException.notFound("Notice");
    repo.incrementViews(n.getId());
    return view(n, true);
  }

  @Transactional(readOnly = true)
  public PageResponse<NoticeView> adminList(String q, int page, int size) {
    String like = q == null || q.isBlank() ? null : "%" + q.toLowerCase(Locale.ROOT).trim() + "%";
    return PageResponse.of(repo.adminSearch(like, PageRequest.of(Math.max(0, page), Math.min(size, 100))), n -> view(n, false));
  }

  @Transactional(readOnly = true)
  public NoticeView get(Long id) {
    return view(repo.findById(id).orElseThrow(() -> ApiException.notFound("Notice")), true);
  }

  @Transactional
  public NoticeView save(Long id, NoticeForm f) {
    if (!CATEGORIES.contains(f.category())) throw ApiException.badRequest("Unknown notice category");
    Notice n = id == null ? new Notice() : repo.findById(id).orElseThrow(() -> ApiException.notFound("Notice"));
    if (id == null) {
      n.setCreatedBy(Current.admin().id());
      n.setSlug(Slugs.unique(Slugs.slugify(f.title()), repo::existsBySlug));
    }
    n.setTitle(f.title().trim());
    n.setBody(Html.clean(f.body()));
    n.setCategory(f.category());
    n.setImportant(Boolean.TRUE.equals(f.important()));
    n.setAttachmentUrl(blank(f.attachmentUrl()));
    n.setAttachmentName(blank(f.attachmentName()));
    n.setNodeId(f.nodeId());
    n.setPublishAt(f.publishAt() == null ? (n.getPublishAt() == null ? Instant.now() : n.getPublishAt()) : f.publishAt());
    n.setExpireAt(f.expireAt());
    n.setActive(f.active() == null || f.active());
    repo.save(n);
    audit.log(id == null ? "CREATE" : "UPDATE", "NOTICE", n.getId(), n.getTitle());
    return view(n, true);
  }

  @Transactional
  public void delete(Long id) {
    Notice n = repo.findById(id).orElseThrow(() -> ApiException.notFound("Notice"));
    repo.delete(n);
    audit.log("DELETE", "NOTICE", id, n.getTitle());
  }

  private static String blank(String s) {
    return s == null || s.isBlank() ? null : s.trim();
  }
}
