package np.eglesson.notice;

import jakarta.validation.Valid;
import java.util.List;
import np.eglesson.common.ApiResponse;
import np.eglesson.common.PageResponse;
import np.eglesson.notice.NoticeService.NoticeForm;
import np.eglesson.notice.NoticeService.NoticeView;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
public class NoticeController {
  private final NoticeService notices;

  public NoticeController(NoticeService notices) {
    this.notices = notices;
  }

  @GetMapping("/api/public/notices")
  public ApiResponse<PageResponse<NoticeView>> live(@RequestParam(required = false) String category,
                                                    @RequestParam(defaultValue = "0") int page,
                                                    @RequestParam(defaultValue = "10") int size) {
    return ApiResponse.ok(notices.live(category, page, size));
  }

  @GetMapping("/api/public/notices/ticker")
  public ApiResponse<List<NoticeView>> ticker() {
    return ApiResponse.ok(notices.ticker());
  }

  @GetMapping("/api/public/notices/{slug}")
  public ApiResponse<NoticeView> read(@PathVariable String slug) {
    return ApiResponse.ok(notices.read(slug));
  }

  @GetMapping("/api/admin/notices")
  @PreAuthorize("hasAuthority('PERM_NOTICES')")
  public ApiResponse<PageResponse<NoticeView>> adminList(@RequestParam(required = false) String q,
                                                         @RequestParam(defaultValue = "0") int page,
                                                         @RequestParam(defaultValue = "20") int size) {
    return ApiResponse.ok(notices.adminList(q, page, size));
  }

  @GetMapping("/api/admin/notices/{id}")
  @PreAuthorize("hasAuthority('PERM_NOTICES')")
  public ApiResponse<NoticeView> get(@PathVariable Long id) {
    return ApiResponse.ok(notices.get(id));
  }

  @PostMapping("/api/admin/notices")
  @PreAuthorize("hasAuthority('PERM_NOTICES')")
  public ApiResponse<NoticeView> create(@Valid @RequestBody NoticeForm f) {
    return ApiResponse.ok("Notice published", notices.save(null, f));
  }

  @PutMapping("/api/admin/notices/{id}")
  @PreAuthorize("hasAuthority('PERM_NOTICES')")
  public ApiResponse<NoticeView> update(@PathVariable Long id, @Valid @RequestBody NoticeForm f) {
    return ApiResponse.ok("Notice saved", notices.save(id, f));
  }

  @DeleteMapping("/api/admin/notices/{id}")
  @PreAuthorize("hasAuthority('PERM_NOTICES')")
  public ApiResponse<Void> delete(@PathVariable Long id) {
    notices.delete(id);
    return ApiResponse.message("Notice deleted");
  }
}
