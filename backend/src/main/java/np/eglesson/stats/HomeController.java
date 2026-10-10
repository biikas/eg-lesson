package np.eglesson.stats;

import java.util.List;
import np.eglesson.catalog.CatalogDtos.NodeView;
import np.eglesson.catalog.CatalogDtos.TreeNode;
import np.eglesson.catalog.CatalogService;
import np.eglesson.common.ApiResponse;
import np.eglesson.content.PostDtos.PostCard;
import np.eglesson.content.PostService;
import np.eglesson.notice.NoticeService;
import np.eglesson.notice.NoticeService.NoticeView;
import np.eglesson.quiz.QuizDtos.QuizCard;
import np.eglesson.quiz.QuizService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/** Everything the student home page needs in one request (phones on slow data connections). */
@RestController
public class HomeController {
  public record Home(List<TreeNode> streams, List<NodeView> featuredNodes, List<PostCard> featured, List<PostCard> latest,
                     List<PostCard> popular, List<NoticeView> notices, List<QuizCard> quizzes, long totalNotes,
                     long totalSubjects) {}

  private final CatalogService catalog;
  private final PostService posts;
  private final NoticeService notices;
  private final QuizService quizzes;

  public HomeController(CatalogService catalog, PostService posts, NoticeService notices, QuizService quizzes) {
    this.catalog = catalog;
    this.posts = posts;
    this.notices = notices;
    this.quizzes = quizzes;
  }

  @GetMapping("/api/public/home")
  public ApiResponse<Home> home() {
    List<TreeNode> tree = catalog.tree(false);
    long notes = tree.stream().mapToLong(TreeNode::postCount).sum();
    long subjects = countLeaves(tree);
    // Streams are sent without grandchildren to keep the payload small.
    List<TreeNode> streams = tree.stream().map(t -> new TreeNode(t.id(), t.parentId(), t.name(), t.shortName(), t.slug(),
        t.description(), t.icon(), t.color(), t.coverImage(), t.typeId(), t.typeCode(), t.typeLabel(), t.depth(),
        t.sortOrder(), t.active(), t.featured(), t.postCount(), t.children().stream().map(c -> new TreeNode(c.id(),
        c.parentId(), c.name(), c.shortName(), c.slug(), null, c.icon(), c.color(), null, c.typeId(), c.typeCode(),
        c.typeLabel(), c.depth(), c.sortOrder(), c.active(), c.featured(), c.postCount(), List.of())).toList())).toList();
    return ApiResponse.ok(new Home(streams, catalog.featured(),
        posts.listLive(null, null, null, null, "latest", true, 0, 6).items(),
        posts.listLive(null, null, null, null, "latest", null, 0, 8).items(),
        posts.listLive(null, null, null, null, "popular", null, 0, 8).items(),
        notices.live(null, 0, 5).items(),
        quizzes.list(null, null, true, null, 0, 4).items(), notes, subjects));
  }

  private long countLeaves(List<TreeNode> nodes) {
    long n = 0;
    for (TreeNode t : nodes) n += t.children().isEmpty() ? 1 : countLeaves(t.children());
    return n;
  }
}
