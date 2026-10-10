package np.eglesson.engage;

import np.eglesson.common.ApiResponse;
import np.eglesson.common.PageResponse;
import np.eglesson.engage.EngageDtos.CommentRow;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/comments")
@PreAuthorize("hasAuthority('PERM_COMMENTS')")
public class AdminCommentController {
  private final EngageService engage;

  public AdminCommentController(EngageService engage) {
    this.engage = engage;
  }

  @GetMapping
  public ApiResponse<PageResponse<CommentRow>> list(@RequestParam(required = false) String status,
                                                    @RequestParam(required = false) Long postId,
                                                    @RequestParam(defaultValue = "0") int page,
                                                    @RequestParam(defaultValue = "20") int size) {
    return ApiResponse.ok(engage.adminComments(status, postId, page, size));
  }

  @PatchMapping("/{id}")
  public ApiResponse<Void> moderate(@PathVariable Long id, @RequestParam CommentStatus status) {
    engage.moderate(id, status);
    return ApiResponse.message("Comment " + status.name().toLowerCase());
  }

  /** Answer a student's comment as the team (shown with a Team badge). */
  @PostMapping("/{id}/reply")
  public ApiResponse<EngageDtos.CommentView> reply(@PathVariable Long id, @jakarta.validation.Valid @RequestBody EngageDtos.CommentForm form) {
    return ApiResponse.ok("Reply posted", engage.adminReply(id, form.body()));
  }

  @DeleteMapping("/{id}")
  public ApiResponse<Void> delete(@PathVariable Long id) {
    engage.adminDelete(id);
    return ApiResponse.message("Comment deleted");
  }
}
