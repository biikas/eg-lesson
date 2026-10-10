package np.eglesson.engage;

import java.util.Map;
import np.eglesson.common.ApiResponse;
import np.eglesson.common.PageResponse;
import np.eglesson.content.PostDtos.PostCard;
import np.eglesson.engage.EngageDtos.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/student")
public class StudentEngageController {
  private final EngageService engage;

  public StudentEngageController(EngageService engage) {
    this.engage = engage;
  }

  @PostMapping("/posts/{id}/like")
  public ApiResponse<Toggle> like(@PathVariable Long id) {
    return ApiResponse.ok(engage.toggleLike(id));
  }

  @PostMapping("/posts/{id}/bookmark")
  public ApiResponse<Toggle> bookmark(@PathVariable Long id) {
    return ApiResponse.ok(engage.toggleBookmark(id));
  }

  @PostMapping("/posts/{id}/progress")
  public ApiResponse<Void> progress(@PathVariable Long id, @RequestBody Map<String, Integer> body) {
    engage.progress(id, body.getOrDefault("percent", 0));
    return ApiResponse.ok(null);
  }

  @DeleteMapping("/comments/{id}")
  public ApiResponse<Void> deleteComment(@PathVariable Long id) {
    engage.deleteOwnComment(id);
    return ApiResponse.message("Comment deleted");
  }

  @GetMapping("/bookmarks")
  public ApiResponse<PageResponse<PostCard>> bookmarks(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "12") int size) {
    return ApiResponse.ok(engage.myBookmarks(page, size));
  }

  @GetMapping("/history")
  public ApiResponse<PageResponse<HistoryItem>> history(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "12") int size) {
    return ApiResponse.ok(engage.myHistory(page, size));
  }

  @GetMapping("/stats")
  public ApiResponse<LearningStats> stats() {
    return ApiResponse.ok(engage.myStats());
  }
}
