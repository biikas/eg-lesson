package np.eglesson.promo;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.List;
import java.util.Set;
import np.eglesson.audit.AuditService;
import np.eglesson.catalog.CatalogService;
import np.eglesson.common.ApiException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PromoService {
  public static final Set<String> KINDS = Set.of("BANNER", "AD");
  /**
   * HOME_HERO: slider at the top of the home page. HOME_STRIP: wide strip between home sections. NODE_TOP: top of
   * category pages. SIDEBAR: beside the note while reading. POST_INLINE: after the note body. POPUP: shown once per
   * visitor per day.
   */
  public static final Set<String> PLACEMENTS = Set.of("HOME_HERO", "HOME_STRIP", "NODE_TOP", "SIDEBAR", "POST_INLINE", "POPUP");

  public record PromoForm(@NotBlank String kind, @NotBlank @Size(max = 200) String title, @Size(max = 500) String subtitle,
                          String imageUrl, String linkUrl, String ctaText, @NotBlank String placement, String bgColor,
                          Long nodeId, Instant startAt, Instant endAt, Integer sortOrder, Boolean active) {}

  public record PromoView(Long id, String kind, String title, String subtitle, String imageUrl, String linkUrl,
                          String ctaText, String placement, String bgColor, Long nodeId, Instant startAt,
                          Instant endAt, int sortOrder, boolean active, long impressions, long clicks) {}

  private final PromoRepository repo;
  private final CatalogService catalog;
  private final AuditService audit;

  public PromoService(PromoRepository repo, CatalogService catalog, AuditService audit) {
    this.repo = repo;
    this.catalog = catalog;
    this.audit = audit;
  }

  static PromoView view(Promo p) {
    return new PromoView(p.getId(), p.getKind(), p.getTitle(), p.getSubtitle(), p.getImageUrl(), p.getLinkUrl(),
        p.getCtaText(), p.getPlacement(), p.getBgColor(), p.getNodeId(), p.getStartAt(), p.getEndAt(), p.getSortOrder(),
        p.isActive(), p.getImpressions(), p.getClicks());
  }

  /** Live promos for a slot. Targeted promos only appear on pages inside their category. */
  @Transactional(readOnly = true)
  public List<PromoView> live(String placement, String nodeSlug) {
    String pagePath = null;
    if (nodeSlug != null && !nodeSlug.isBlank()) {
      try {
        pagePath = catalog.getBySlug(nodeSlug).path();
      } catch (ApiException ignored) {
        // unknown slug: show only untargeted promos
      }
    }
    final String path = pagePath;
    return repo.live(placement, Instant.now()).stream()
        .filter(p -> p.getNodeId() == null || (path != null && catalog.find(p.getNodeId()).map(n -> path.startsWith(n.path())).orElse(false)))
        .map(p -> new PromoView(p.getId(), p.getKind(), p.getTitle(), p.getSubtitle(), p.getImageUrl(), p.getLinkUrl(),
            p.getCtaText(), p.getPlacement(), p.getBgColor(), null, null, null, p.getSortOrder(), true, 0, 0))
        .toList();
  }

  @Transactional
  public void impressions(List<Long> ids) {
    if (ids != null && !ids.isEmpty()) repo.addImpressions(ids.stream().limit(20).toList());
  }

  @Transactional
  public void click(Long id) {
    repo.addClick(id);
  }

  public List<PromoView> all() {
    return repo.findAllByOrderByPlacementAscSortOrderAscIdDesc().stream().map(PromoService::view).toList();
  }

  @Transactional
  public PromoView save(Long id, PromoForm f) {
    if (!KINDS.contains(f.kind())) throw ApiException.badRequest("Kind must be BANNER or AD");
    if (!PLACEMENTS.contains(f.placement())) throw ApiException.badRequest("Unknown placement");
    if (f.startAt() != null && f.endAt() != null && !f.endAt().isAfter(f.startAt())) throw ApiException.badRequest("End must be after start");
    Promo p = id == null ? new Promo() : repo.findById(id).orElseThrow(() -> ApiException.notFound("Banner"));
    p.setKind(f.kind());
    p.setTitle(f.title().trim());
    p.setSubtitle(blank(f.subtitle()));
    p.setImageUrl(blank(f.imageUrl()));
    p.setLinkUrl(blank(f.linkUrl()));
    p.setCtaText(blank(f.ctaText()));
    p.setPlacement(f.placement());
    p.setBgColor(blank(f.bgColor()));
    p.setNodeId(f.nodeId());
    p.setStartAt(f.startAt());
    p.setEndAt(f.endAt());
    p.setSortOrder(f.sortOrder() == null ? 0 : f.sortOrder());
    p.setActive(f.active() == null || f.active());
    repo.save(p);
    audit.log(id == null ? "CREATE" : "UPDATE", f.kind(), p.getId(), p.getTitle());
    return view(p);
  }

  @Transactional
  public void delete(Long id) {
    Promo p = repo.findById(id).orElseThrow(() -> ApiException.notFound("Banner"));
    repo.delete(p);
    audit.log("DELETE", p.getKind(), id, p.getTitle());
  }

  private static String blank(String s) {
    return s == null || s.isBlank() ? null : s.trim();
  }
}
