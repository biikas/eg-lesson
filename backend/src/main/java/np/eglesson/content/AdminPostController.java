package np.eglesson.content;

import jakarta.validation.Valid;
import np.eglesson.common.ApiResponse;
import np.eglesson.common.PageResponse;
import np.eglesson.content.PostDtos.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/posts")
public class AdminPostController {
  private final PostService posts;

  public AdminPostController(PostService posts) {
    this.posts = posts;
  }

  @GetMapping
  @PreAuthorize("hasAnyAuthority('PERM_CONTENT_WRITE','PERM_CONTENT_PUBLISH')")
  public ApiResponse<PageResponse<PostCard>> list(@RequestParam(required = false) String q,
                                                  @RequestParam(required = false) Long nodeId,
                                                  @RequestParam(required = false) Long contentTypeId,
                                                  @RequestParam(required = false) String status,
                                                  @RequestParam(required = false) Long authorId,
                                                  @RequestParam(required = false) String sort,
                                                  @RequestParam(defaultValue = "0") int page,
                                                  @RequestParam(defaultValue = "20") int size) {
    return ApiResponse.ok(posts.adminList(q, nodeId, contentTypeId, status, authorId, sort, page, size));
  }

  @GetMapping("/{id}")
  @PreAuthorize("hasAnyAuthority('PERM_CONTENT_WRITE','PERM_CONTENT_PUBLISH')")
  public ApiResponse<PostEdit> get(@PathVariable Long id) {
    return ApiResponse.ok(posts.get(id));
  }

  @PostMapping
  @PreAuthorize("hasAnyAuthority('PERM_CONTENT_WRITE','PERM_CONTENT_PUBLISH')")
  public ApiResponse<PostEdit> create(@Valid @RequestBody PostForm form) {
    return ApiResponse.ok("Post saved", posts.save(null, form));
  }

  @PutMapping("/{id}")
  @PreAuthorize("hasAnyAuthority('PERM_CONTENT_WRITE','PERM_CONTENT_PUBLISH')")
  public ApiResponse<PostEdit> update(@PathVariable Long id, @Valid @RequestBody PostForm form) {
    return ApiResponse.ok("Post saved", posts.save(id, form));
  }

  @PatchMapping("/{id}/status")
  @PreAuthorize("hasAuthority('PERM_CONTENT_PUBLISH')")
  public ApiResponse<Void> status(@PathVariable Long id, @RequestParam PostStatus status) {
    posts.setStatus(id, status);
    return ApiResponse.message("Status changed to " + status.name().toLowerCase());
  }

  @DeleteMapping("/{id}")
  @PreAuthorize("hasAuthority('PERM_CONTENT_PUBLISH')")
  public ApiResponse<Void> delete(@PathVariable Long id) {
    posts.delete(id);
    return ApiResponse.message("Post deleted");
  }
}
