package np.eglesson.catalog;

import java.util.List;
import np.eglesson.catalog.CatalogDtos.*;
import np.eglesson.common.ApiResponse;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/public/catalog")
public class PublicCatalogController {
  private final CatalogService catalog;

  public PublicCatalogController(CatalogService catalog) {
    this.catalog = catalog;
  }

  @GetMapping("/tree")
  public ApiResponse<List<TreeNode>> tree() {
    return ApiResponse.ok(catalog.tree(false));
  }

  @GetMapping("/nodes/{slug}")
  public ApiResponse<NodePage> node(@PathVariable String slug) {
    return ApiResponse.ok(catalog.page(slug));
  }

  @GetMapping("/content-types")
  public ApiResponse<List<ContentType>> contentTypes() {
    return ApiResponse.ok(catalog.contentTypes(true));
  }
}
