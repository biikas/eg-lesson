package np.eglesson.stats;

import np.eglesson.common.ApiResponse;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/stats")
public class StatsController {
  private final StatsService stats;

  public StatsController(StatsService stats) {
    this.stats = stats;
  }

  @GetMapping("/dashboard")
  @PreAuthorize("hasAuthority('PERM_DASHBOARD')")
  public ApiResponse<StatsService.Dashboard> dashboard(@RequestParam(defaultValue = "30") int days) {
    return ApiResponse.ok(stats.dashboard(days));
  }

  @GetMapping("/posts/{id}")
  @PreAuthorize("hasAnyAuthority('PERM_DASHBOARD','PERM_CONTENT_WRITE','PERM_CONTENT_PUBLISH')")
  public ApiResponse<StatsService.PostStats> post(@PathVariable Long id) {
    return ApiResponse.ok(stats.post(id));
  }
}
