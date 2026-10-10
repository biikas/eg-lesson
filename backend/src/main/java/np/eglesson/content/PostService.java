package np.eglesson.content;

import java.time.Instant;
import java.util.*;
import np.eglesson.audit.AuditService;
import np.eglesson.auth.AdminUserRepository;
import np.eglesson.catalog.CatalogDtos.NodeView;
import np.eglesson.catalog.CatalogNodeRepository;
import np.eglesson.catalog.CatalogService;
import np.eglesson.catalog.ContentType;
import np.eglesson.catalog.ContentTypeRepository;
import np.eglesson.common.*;
import np.eglesson.config.AuthPrincipal;
import np.eglesson.config.Current;
import np.eglesson.content.PostDtos.*;
import np.eglesson.engage.BookmarkRepository;
import np.eglesson.engage.PostLikeRepository;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PostService {
  private static final Set<String> SORTS = Set.of("latest", "popular", "oldest", "title", "updated", "relevance");

  private final PostRepository posts;
  private final CatalogService catalog;
  private final CatalogNodeRepository nodes;
  private final ContentTypeRepository contentTypes;
  private final AdminUserRepository admins;
  private final PostLikeRepository likes;
  private final BookmarkRepository bookmarks;
  private final AuditService audit;

  public PostService(PostRepository posts, CatalogService catalog, CatalogNodeRepository nodes,
                     ContentTypeRepository contentTypes, AdminUserRepository admins, PostLikeRepository likes,
                     BookmarkRepository bookmarks, AuditService audit) {
    this.posts = posts;
    this.catalog = catalog;
    this.nodes = nodes;
    this.contentTypes = contentTypes;
    this.admins = admins;
    this.likes = likes;
    this.bookmarks = bookmarks;
    this.audit = audit;
  }

  // ------------------------------------------------------------------ mapping

  public PostCard card(Post p) {
    ContentType ct = p.getContentType();
    NodeView n = catalog.find(p.getNode().getId()).orElse(null);
    NodeRef node = n == null ? null : new NodeRef(n.id(), n.name(), n.slug(), n.icon(), n.color(), catalog.pathLabel(n.id()));
    String status = p.getStatus() == PostStatus.PUBLISHED && p.getPublishedAt() != null && p.getPublishedAt().isAfter(Instant.now())
        ? "SCHEDULED" : p.getStatus().name();
    return new PostCard(p.getId(), p.getTitle(), p.getSlug(), p.getExcerpt(), p.getCoverImage(),
        new TypeRef(ct.getId(), ct.getCode(), ct.getName(), ct.getIcon(), ct.getColor()), node, p.getLanguage(),
        p.getDifficulty(), p.getReadMinutes(), p.getPublishedAt(), p.getViewCount(), p.getLikeCount(),
        p.getCommentCount(), p.isFeatured(), p.getVideoUrl() != null && !p.getVideoUrl().isBlank(), status,
        p.getAuthor() == null ? null : p.getAuthor().getFullName(), p.getUpdatedAt());
  }

  private PostEdit edit(Post p) {
    return new PostEdit(p.getId(), p.getTitle(), p.getSlug(), p.getExcerpt(), p.getBody(), p.getCoverImage(),
        p.getNode().getId(), catalog.find(p.getNode().getId()).map(n -> catalog.pathLabel(n.id())).orElse(null),
        p.getContentType().getId(), p.getLanguage(), p.getDifficulty(), p.getVideoUrl(), p.getStatus(), p.isFeatured(),
        p.isAllowComments(), p.getPublishedAt(), p.getMetaTitle(), p.getMetaDescription(), new ArrayList<>(p.getTags()),
        p.getAttachments().stream().map(a -> new Attachment(a.getTitle(), a.getUrl())).toList(),
        p.getAuthor() == null ? null : p.getAuthor().getFullName(), p.getViewCount(), p.getLikeCount(),
        p.getCommentCount(), p.getBookmarkCount(), p.getCreatedAt(), p.getUpdatedAt());
  }

  static Sort sortOf(String sort) {
    String s = sort == null || !SORTS.contains(sort) ? "latest" : sort;
    return switch (s) {
      case "popular" -> Sort.by(Sort.Order.desc("viewCount"), Sort.Order.desc("publishedAt"));
      case "oldest" -> Sort.by(Sort.Order.asc("publishedAt"), Sort.Order.asc("id"));
      case "title" -> Sort.by(Sort.Order.asc("title"));
      case "updated" -> Sort.by(Sort.Order.desc("updatedAt"));
      case "relevance" -> Sort.unsorted();
      default -> Sort.by(Sort.Order.desc("publishedAt"), Sort.Order.desc("id"));
    };
  }

  private static Pageable pageable(int page, int size, Sort sort) {
    return PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 60), sort);
  }

  // ------------------------------------------------------------------ student-facing

  @Transactional(readOnly = true)
  public PageResponse<PostCard> listLive(String nodeSlug, String typeCode, String language, String q, String sort,
                                         Boolean featured, int page, int size) {
    String path = null;
    if (nodeSlug != null && !nodeSlug.isBlank()) path = catalog.getBySlug(nodeSlug).path();
    var filter = new PostSpecs.Filter(q, path, null, null, blankToNull(typeCode), blankToNull(language), null, null, null, true, featured);
    Specification<Post> spec = PostSpecs.of(filter);
    boolean relevance = q != null && !q.isBlank() && (sort == null || "relevance".equals(sort));
    if (relevance) spec = spec.and(PostSpecs.relevance(q));
    Page<Post> result = posts.findAll(spec, pageable(page, size, relevance ? Sort.unsorted() : sortOf(sort)));
    return PageResponse.of(result, this::card);
  }

  @Transactional(readOnly = true)
  public PostDetail detail(String slug) {
    Post p = posts.findBySlug(slug).orElseThrow(() -> ApiException.notFound("Post"));
    AuthPrincipal who = Current.principalOrNull();
    // Admins may preview drafts and scheduled posts from the editor.
    if (!p.isLive() && (who == null || !who.isAdmin())) throw ApiException.notFound("Post");
    NodeView node = catalog.get(p.getNode().getId());
    if (!catalog.isVisible(node) && (who == null || !who.isAdmin())) throw ApiException.notFound("Post");

    Long studentId = Current.studentIdOrNull();
    boolean liked = studentId != null && likes.existsByStudentIdAndPostId(studentId, p.getId());
    boolean bookmarked = studentId != null && bookmarks.existsByStudentIdAndPostId(studentId, p.getId());

    // Previous / next within the same subject, in publishing order: reads like a book.
    List<Post> siblings = posts.liveInNode(node.id(), Instant.now());
    PostCard prev = null, next = null;
    for (int i = 0; i < siblings.size(); i++) {
      if (siblings.get(i).getId().equals(p.getId())) {
        if (i > 0) prev = card(siblings.get(i - 1));
        if (i < siblings.size() - 1) next = card(siblings.get(i + 1));
      }
    }
    List<PostCard> related = related(p, node);

    return new PostDetail(card(p), p.getBody(), new ArrayList<>(p.getTags()),
        p.getAttachments().stream().map(a -> new Attachment(a.getTitle(), a.getUrl())).toList(), p.getVideoUrl(),
        catalog.breadcrumb(node.id()), p.isAllowComments(), p.getMetaTitle(), p.getMetaDescription(),
        p.getBookmarkCount(), liked, bookmarked, prev, next, related);
  }

  /** Same subject first, then the parent (class/semester), most viewed. */
  private List<PostCard> related(Post p, NodeView node) {
    List<PostCard> out = new ArrayList<>();
    Set<Long> seen = new HashSet<>(Set.of(p.getId()));
    String parentPath = node.parentId() == null ? node.path() : catalog.get(node.parentId()).path();
    for (String path : List.of(node.path(), parentPath)) {
      var spec = PostSpecs.of(new PostSpecs.Filter(null, path, null, null, null, null, null, null, null, true, null));
      for (Post r : posts.findAll(spec, PageRequest.of(0, 8, sortOf("popular")))) {
        if (out.size() >= 6) break;
        if (seen.add(r.getId())) out.add(card(r));
      }
    }
    return out;
  }

  // ------------------------------------------------------------------ admin

  @Transactional(readOnly = true)
  public PageResponse<PostCard> adminList(String q, Long nodeId, Long contentTypeId, String status, Long authorId,
                                          String sort, int page, int size) {
    String path = nodeId == null ? null : catalog.get(nodeId).path();
    PostStatus st = null;
    Boolean scheduled = null;
    if ("SCHEDULED".equals(status)) {
      st = PostStatus.PUBLISHED;
      scheduled = true;
    } else if (status != null && !status.isBlank()) {
      st = PostStatus.valueOf(status);
    }
    var filter = new PostSpecs.Filter(q, path, null, contentTypeId, null, null, st, scheduled, authorId, false, null);
    return PageResponse.of(posts.findAll(PostSpecs.of(filter), pageable(page, size, sortOf(sort == null ? "updated" : sort))), this::card);
  }

  @Transactional(readOnly = true)
  public PostEdit get(Long id) {
    return edit(posts.findById(id).orElseThrow(() -> ApiException.notFound("Post")));
  }

  @Transactional
  public PostEdit save(Long id, PostForm f) {
    AuthPrincipal me = Current.admin();
    boolean canPublish = Current.has("CONTENT_PUBLISH");
    Post p;
    if (id == null) {
      p = new Post();
      p.setAuthor(admins.getReferenceById(me.id()));
    } else {
      p = posts.findById(id).orElseThrow(() -> ApiException.notFound("Post"));
      boolean own = p.getAuthor() != null && p.getAuthor().getId().equals(me.id());
      if (!canPublish && (!own || p.getStatus() == PostStatus.PUBLISHED)) {
        throw ApiException.forbidden("Only an editor with publish rights can change this post.");
      }
    }
    PostStatus status = f.status();
    if (!canPublish && (status == PostStatus.PUBLISHED || status == PostStatus.ARCHIVED)) {
      // Writers without publish rights submit for review instead.
      status = PostStatus.REVIEW;
    }

    p.setTitle(f.title().trim());
    String wantedSlug = f.slug() != null && !f.slug().isBlank() ? Slugs.slugify(f.slug()) : Slugs.slugify(f.title());
    if (!wantedSlug.equals(p.getSlug())) {
      String current = p.getSlug();
      p.setSlug(Slugs.unique(wantedSlug, s -> !s.equals(current) && posts.existsBySlug(s)));
    }
    String body = Html.clean(f.body());
    String text = Html.text(body);
    p.setBody(body);
    p.setExcerpt(f.excerpt() != null && !f.excerpt().isBlank() ? f.excerpt().trim() : abbreviate(text, 220));
    p.setCoverImage(blankToNull(f.coverImage()));
    p.setNode(nodes.findById(f.nodeId()).orElseThrow(() -> ApiException.badRequest("Choose a subject/category")));
    p.setContentType(contentTypes.findById(f.contentTypeId()).orElseThrow(() -> ApiException.badRequest("Choose a content type")));
    p.setLanguage(f.language() == null || f.language().isBlank() ? "EN" : f.language());
    p.setDifficulty(blankToNull(f.difficulty()));
    p.setVideoUrl(youtubeEmbed(blankToNull(f.videoUrl())));
    p.setFeatured(Boolean.TRUE.equals(f.featured()) && canPublish);
    p.setAllowComments(f.allowComments() == null || f.allowComments());
    p.setMetaTitle(blankToNull(f.metaTitle()));
    p.setMetaDescription(blankToNull(f.metaDescription()));
    // Nepali text is read slower; ~180 words per minute keeps estimates honest for both.
    p.setReadMinutes(Math.max(1, (int) Math.ceil(text.split("\\s+").length / 180.0)));

    PostStatus before = p.getStatus();
    p.setStatus(status);
    if (status == PostStatus.PUBLISHED) {
      if (f.publishedAt() != null) p.setPublishedAt(f.publishedAt());
      else if (p.getPublishedAt() == null || before != PostStatus.PUBLISHED) p.setPublishedAt(Instant.now());
    }

    p.getTags().clear();
    if (f.tags() != null) {
      f.tags().stream().map(t -> t.trim().toLowerCase(Locale.ROOT)).filter(t -> !t.isBlank() && t.length() <= 60)
          .distinct().limit(15).forEach(p.getTags()::add);
    }
    p.getAttachments().clear();
    if (f.attachments() != null) {
      int i = 0;
      for (Attachment a : f.attachments()) {
        if (a.url() == null || a.url().isBlank()) continue;
        PostAttachment pa = new PostAttachment();
        pa.setPost(p);
        pa.setTitle(a.title() == null || a.title().isBlank() ? "Download" : a.title().trim());
        pa.setUrl(a.url().trim());
        pa.setSortOrder(i++);
        p.getAttachments().add(pa);
      }
    }
    p.setSearchText(String.join(" ", p.getTitle(), Objects.toString(p.getExcerpt(), ""), String.join(" ", p.getTags()),
        catalog.fullPathText(p.getNode().getId()), p.getContentType().getName(), text).toLowerCase(Locale.ROOT));
    posts.save(p);
    catalog.invalidateCounts();
    audit.log(id == null ? "CREATE" : (before != status ? status.name() : "UPDATE"), "POST", p.getId(), p.getTitle());
    return edit(p);
  }

  @Transactional
  public void setStatus(Long id, PostStatus status) {
    Post p = posts.findById(id).orElseThrow(() -> ApiException.notFound("Post"));
    p.setStatus(status);
    if (status == PostStatus.PUBLISHED && p.getPublishedAt() == null) p.setPublishedAt(Instant.now());
    catalog.invalidateCounts();
    audit.log(status.name(), "POST", id, p.getTitle());
  }

  @Transactional
  public void delete(Long id) {
    Post p = posts.findById(id).orElseThrow(() -> ApiException.notFound("Post"));
    posts.delete(p);
    catalog.invalidateCounts();
    audit.log("DELETE", "POST", id, p.getTitle());
  }

  /** Accepts a normal YouTube link and stores the embeddable form. */
  static String youtubeEmbed(String url) {
    if (url == null) return null;
    var m = java.util.regex.Pattern.compile("(?:youtube\\.com/(?:watch\\?v=|embed/|shorts/)|youtu\\.be/)([A-Za-z0-9_-]{6,})").matcher(url);
    return m.find() ? "https://www.youtube.com/embed/" + m.group(1) : url;
  }

  private static String abbreviate(String s, int max) {
    if (s == null) return null;
    s = s.trim();
    if (s.length() <= max) return s;
    int cut = s.lastIndexOf(' ', max);
    return s.substring(0, cut > 40 ? cut : max) + "…";
  }

  private static String blankToNull(String s) {
    return s == null || s.isBlank() ? null : s.trim();
  }
}
