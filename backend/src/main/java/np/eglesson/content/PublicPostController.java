package np.eglesson.content;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import np.eglesson.catalog.CatalogService;
import np.eglesson.common.ApiResponse;
import np.eglesson.common.PageResponse;
import np.eglesson.config.Current;
import np.eglesson.content.PostDtos.*;
import np.eglesson.engage.EngageDtos.CommentForm;
import np.eglesson.engage.EngageDtos.CommentView;
import np.eglesson.engage.EngageService;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/public")
public class PublicPostController {
  private final PostService posts;
  private final CatalogService catalog;
  private final EngageService engage;
  private final SearchLogRepository searchLog;

  public PublicPostController(PostService posts, CatalogService catalog, EngageService engage, SearchLogRepository searchLog) {
    this.posts = posts;
    this.catalog = catalog;
    this.engage = engage;
    this.searchLog = searchLog;
  }

  @GetMapping("/posts")
  public ApiResponse<PageResponse<PostCard>> list(@RequestParam(required = false) String node,
                                                  @RequestParam(required = false) String type,
                                                  @RequestParam(required = false) String lang,
                                                  @RequestParam(required = false) String sort,
                                                  @RequestParam(required = false) Boolean featured,
                                                  @RequestParam(defaultValue = "0") int page,
                                                  @RequestParam(defaultValue = "12") int size) {
    return ApiResponse.ok(posts.listLive(node, type, lang, null, sort, featured, page, size));
  }

  @GetMapping("/posts/{slug}")
  public ApiResponse<PostDetail> detail(@PathVariable String slug) {
    return ApiResponse.ok(posts.detail(slug));
  }

  @PostMapping("/posts/{id}/view")
  public ApiResponse<Void> view(@PathVariable Long id) {
    engage.recordView(id);
    return ApiResponse.ok(null);
  }

  @GetMapping("/posts/{id}/comments")
  public ApiResponse<List<CommentView>> comments(@PathVariable Long id) {
    return ApiResponse.ok(engage.commentsFor(id));
  }

  /** Students and admins (replying as the team) both post here; guests get 401. */
  @PostMapping("/posts/{id}/comments")
  public ApiResponse<CommentView> comment(@PathVariable Long id, @Valid @RequestBody CommentForm form) {
    CommentView c = engage.addComment(id, form);
    return ApiResponse.ok("PENDING".equals(c.status()) ? "Thanks! Your comment will appear after review." : "Comment posted", c);
  }

  /** Full search: matching categories (subjects, classes...) plus matching posts. */
  @GetMapping("/search")
  public ApiResponse<SearchResult> search(@RequestParam String q,
                                          @RequestParam(required = false) String node,
                                          @RequestParam(required = false) String type,
                                          @RequestParam(required = false) String lang,
                                          @RequestParam(required = false) String sort,
                                          @RequestParam(defaultValue = "0") int page,
                                          @RequestParam(defaultValue = "12") int size) {
    String term = q.trim();
    if (term.length() > 100) term = term.substring(0, 100);
    List<Suggestion> cats = page == 0 ? catalog.search(term, 8).stream().map(n -> new Suggestion("CATEGORY", n.name(),
        catalog.pathLabel(n.id()), n.slug(), n.icon(), n.color())).toList() : List.of();
    PageResponse<PostCard> result = posts.listLive(node, type, lang, term, sort, null, page, size);
    if (page == 0 && !term.isBlank()) {
      SearchLog log = new SearchLog();
      log.setTerm(term.toLowerCase(Locale.ROOT));
      log.setResults((int) result.total() + cats.size());
      log.setStudentId(Current.studentIdOrNull());
      searchLog.save(log);
    }
    return ApiResponse.ok(new SearchResult(cats, result));
  }

  /** As-you-type suggestions for the search box (not logged). */
  @GetMapping("/search/suggest")
  public ApiResponse<List<Suggestion>> suggest(@RequestParam String q) {
    String term = q.trim();
    List<Suggestion> out = new ArrayList<>();
    if (term.length() < 2) return ApiResponse.ok(out);
    catalog.search(term, 5).forEach(n -> out.add(new Suggestion("CATEGORY", n.name(), catalog.pathLabel(n.id()), n.slug(), n.icon(), n.color())));
    posts.listLive(null, null, null, term, "relevance", null, 0, 6).items().forEach(p -> out.add(new Suggestion("POST", p.title(),
        p.contentType().name() + (p.node() == null ? "" : " · " + p.node().pathLabel()), p.slug(), p.contentType().icon(), p.contentType().color())));
    return ApiResponse.ok(out);
  }
}
