package np.eglesson.audit;

import np.eglesson.common.ApiResponse;
import np.eglesson.common.PageResponse;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/audit")
@PreAuthorize("hasAuthority('PERM_AUDIT')")
public class AuditController {
  private final AuditLogRepository repo;

  public AuditController(AuditLogRepository repo) {
    this.repo = repo;
  }

  @GetMapping
  public ApiResponse<PageResponse<AuditLog>> list(@RequestParam(required = false) Long adminId,
                                                  @RequestParam(required = false) String entity,
                                                  @RequestParam(defaultValue = "0") int page,
                                                  @RequestParam(defaultValue = "30") int size) {
    return ApiResponse.ok(PageResponse.of(repo.search(adminId, entity == null || entity.isBlank() ? null : entity,
        PageRequest.of(Math.max(0, page), Math.min(size, 100))), a -> a));
  }
}
