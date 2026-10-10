package np.eglesson.promo;

import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import np.eglesson.common.ApiResponse;
import np.eglesson.promo.PromoService.PromoForm;
import np.eglesson.promo.PromoService.PromoView;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
public class PromoController {
  private final PromoService promos;

  public PromoController(PromoService promos) {
    this.promos = promos;
  }

  @GetMapping("/api/public/promos")
  public ApiResponse<List<PromoView>> live(@RequestParam String placement, @RequestParam(required = false) String node) {
    return ApiResponse.ok(promos.live(placement, node));
  }

  @PostMapping("/api/public/promos/impressions")
  public ApiResponse<Void> impressions(@RequestBody Map<String, List<Long>> body) {
    promos.impressions(body.get("ids"));
    return ApiResponse.ok(null);
  }

  @PostMapping("/api/public/promos/{id}/click")
  public ApiResponse<Void> click(@PathVariable Long id) {
    promos.click(id);
    return ApiResponse.ok(null);
  }

  @GetMapping("/api/admin/promos")
  @PreAuthorize("hasAuthority('PERM_PROMOS')")
  public ApiResponse<List<PromoView>> all() {
    return ApiResponse.ok(promos.all());
  }

  @PostMapping("/api/admin/promos")
  @PreAuthorize("hasAuthority('PERM_PROMOS')")
  public ApiResponse<PromoView> create(@Valid @RequestBody PromoForm f) {
    return ApiResponse.ok("Saved", promos.save(null, f));
  }

  @PutMapping("/api/admin/promos/{id}")
  @PreAuthorize("hasAuthority('PERM_PROMOS')")
  public ApiResponse<PromoView> update(@PathVariable Long id, @Valid @RequestBody PromoForm f) {
    return ApiResponse.ok("Saved", promos.save(id, f));
  }

  @DeleteMapping("/api/admin/promos/{id}")
  @PreAuthorize("hasAuthority('PERM_PROMOS')")
  public ApiResponse<Void> delete(@PathVariable Long id) {
    promos.delete(id);
    return ApiResponse.message("Deleted");
  }
}
