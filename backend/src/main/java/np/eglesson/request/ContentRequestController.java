package np.eglesson.request;

import jakarta.validation.Valid;
import java.util.List;
import np.eglesson.common.ApiResponse;
import np.eglesson.common.PageResponse;
import np.eglesson.request.ContentRequestService.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
public class ContentRequestController {
  private final ContentRequestService requests;

  public ContentRequestController(ContentRequestService requests) {
    this.requests = requests;
  }

  @PostMapping("/api/student/requests")
  public ApiResponse<RequestView> create(@Valid @RequestBody RequestForm f) {
    return ApiResponse.ok("Request sent! We'll notify you here when it's ready.", requests.create(f));
  }

  @GetMapping("/api/student/requests")
  public ApiResponse<List<RequestView>> mine() {
    return ApiResponse.ok(requests.mine());
  }

  @GetMapping("/api/admin/requests")
  @PreAuthorize("hasAuthority('PERM_REQUESTS')")
  public ApiResponse<PageResponse<RequestView>> list(@RequestParam(required = false) String status,
                                                     @RequestParam(defaultValue = "0") int page,
                                                     @RequestParam(defaultValue = "20") int size) {
    return ApiResponse.ok(requests.adminList(status, page, size));
  }

  @PutMapping("/api/admin/requests/{id}")
  @PreAuthorize("hasAuthority('PERM_REQUESTS')")
  public ApiResponse<RequestView> resolve(@PathVariable Long id, @Valid @RequestBody ResolveForm f) {
    return ApiResponse.ok("Request updated", requests.resolve(id, f));
  }
}
