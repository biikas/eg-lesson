package np.eglesson.catalog;

import jakarta.validation.Valid;
import java.util.List;
import np.eglesson.catalog.CatalogDtos.*;
import np.eglesson.common.ApiResponse;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/catalog")
public class AdminCatalogController {
  private final CatalogService catalog;

  public AdminCatalogController(CatalogService catalog) {
    this.catalog = catalog;
  }

  /** Writers need the tree too (to pick a subject for a post), so reading only requires being an admin. */
  @GetMapping("/tree")
  public ApiResponse<List<TreeNode>> tree() {
    return ApiResponse.ok(catalog.tree(true));
  }

  @PostMapping("/nodes")
  @PreAuthorize("hasAuthority('PERM_CATALOG')")
  public ApiResponse<NodeView> create(@Valid @RequestBody NodeForm form) {
    return ApiResponse.ok("Category created", catalog.create(form));
  }

  @PutMapping("/nodes/{id}")
  @PreAuthorize("hasAuthority('PERM_CATALOG')")
  public ApiResponse<NodeView> update(@PathVariable Long id, @Valid @RequestBody NodeForm form) {
    return ApiResponse.ok("Category saved", catalog.update(id, form));
  }

  @PostMapping("/nodes/reorder")
  @PreAuthorize("hasAuthority('PERM_CATALOG')")
  public ApiResponse<Void> reorder(@RequestBody List<@Valid ReorderItem> items) {
    catalog.reorder(items);
    return ApiResponse.message("Order saved");
  }

  @DeleteMapping("/nodes/{id}")
  @PreAuthorize("hasAuthority('PERM_CATALOG')")
  public ApiResponse<Void> delete(@PathVariable Long id) {
    catalog.delete(id);
    return ApiResponse.message("Category deleted");
  }

  @GetMapping("/node-types")
  public ApiResponse<List<NodeType>> nodeTypes() {
    return ApiResponse.ok(catalog.nodeTypes());
  }

  @PostMapping("/node-types")
  @PreAuthorize("hasAuthority('PERM_CATALOG')")
  public ApiResponse<NodeType> createType(@Valid @RequestBody NodeTypeForm form) {
    return ApiResponse.ok("Level type created", catalog.saveNodeType(null, form));
  }

  @PutMapping("/node-types/{id}")
  @PreAuthorize("hasAuthority('PERM_CATALOG')")
  public ApiResponse<NodeType> updateType(@PathVariable Long id, @Valid @RequestBody NodeTypeForm form) {
    return ApiResponse.ok("Level type saved", catalog.saveNodeType(id, form));
  }

  @DeleteMapping("/node-types/{id}")
  @PreAuthorize("hasAuthority('PERM_CATALOG')")
  public ApiResponse<Void> deleteType(@PathVariable Long id) {
    catalog.deleteNodeType(id);
    return ApiResponse.message("Level type deleted");
  }

  @GetMapping("/content-types")
  public ApiResponse<List<ContentType>> contentTypes() {
    return ApiResponse.ok(catalog.contentTypes(false));
  }

  @PostMapping("/content-types")
  @PreAuthorize("hasAuthority('PERM_CATALOG')")
  public ApiResponse<ContentType> createContentType(@Valid @RequestBody ContentTypeForm form) {
    return ApiResponse.ok("Content type created", catalog.saveContentType(null, form));
  }

  @PutMapping("/content-types/{id}")
  @PreAuthorize("hasAuthority('PERM_CATALOG')")
  public ApiResponse<ContentType> updateContentType(@PathVariable Long id, @Valid @RequestBody ContentTypeForm form) {
    return ApiResponse.ok("Content type saved", catalog.saveContentType(id, form));
  }

  @DeleteMapping("/content-types/{id}")
  @PreAuthorize("hasAuthority('PERM_CATALOG')")
  public ApiResponse<Void> deleteContentType(@PathVariable Long id) {
    catalog.deleteContentType(id);
    return ApiResponse.message("Content type deleted");
  }
}
