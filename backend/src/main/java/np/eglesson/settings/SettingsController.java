package np.eglesson.settings;

import java.util.Map;
import np.eglesson.common.ApiResponse;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
public class SettingsController {
  private final SettingsService settings;

  public SettingsController(SettingsService settings) {
    this.settings = settings;
  }

  @GetMapping("/api/public/settings")
  public ApiResponse<Map<String, String>> publicSettings() {
    return ApiResponse.ok(settings.publicSettings());
  }

  @GetMapping("/api/admin/settings")
  @PreAuthorize("hasAuthority('PERM_SETTINGS')")
  public ApiResponse<Map<String, String>> all() {
    return ApiResponse.ok(settings.all());
  }

  @PutMapping("/api/admin/settings")
  @PreAuthorize("hasAuthority('PERM_SETTINGS')")
  public ApiResponse<Map<String, String>> update(@RequestBody Map<String, String> values) {
    return ApiResponse.ok("Settings saved", settings.update(values));
  }
}
