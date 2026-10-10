package np.eglesson.catalog;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

public final class CatalogDtos {
  private CatalogDtos() {}

  /** Immutable copy of a node, held in the in-memory catalog snapshot. */
  public record NodeView(Long id, Long parentId, String name, String shortName, String slug, String description,
                         String icon, String color, String coverImage, Long typeId, String typeCode, String typeLabel,
                         String path, int depth, int sortOrder, boolean active, boolean featured) {
    static NodeView of(CatalogNode n) {
      return new NodeView(n.getId(), n.getParentId(), n.getName(), n.getShortName(), n.getSlug(), n.getDescription(),
          n.getIcon(), n.getColor(), n.getCoverImage(), n.getNodeType().getId(), n.getNodeType().getCode(),
          n.getNodeType().getLabel(), n.getPath(), n.getDepth(), n.getSortOrder(), n.isActive(), n.isFeatured());
    }
  }

  public record TreeNode(Long id, Long parentId, String name, String shortName, String slug, String description,
                         String icon, String color, String coverImage, Long typeId, String typeCode, String typeLabel,
                         int depth, int sortOrder, boolean active, boolean featured, long postCount,
                         List<TreeNode> children) {}

  public record Crumb(Long id, String name, String slug, String typeLabel) {}

  /** Node page: the node, how to get back up, what is below it and which kinds of material exist under it. */
  public record NodePage(NodeView node, List<Crumb> breadcrumb, List<TreeNode> children, long postCount,
                         List<ContentTypeCount> contentTypes) {}

  public record ContentTypeCount(Long id, String code, String name, String icon, String color, long count) {}

  public record NodeForm(Long parentId, @NotNull Long typeId, @NotBlank @Size(max = 150) String name,
                         @Size(max = 60) String shortName, @Size(max = 190) String slug,
                         @Size(max = 1000) String description, String icon, String color, String coverImage,
                         Integer sortOrder, Boolean active, Boolean featured) {}

  public record ReorderItem(@NotNull Long id, Long parentId, int sortOrder) {}

  public record NodeTypeForm(@NotBlank @Size(max = 40) String code, @NotBlank @Size(max = 60) String label,
                             String icon, Integer sortOrder) {}

  public record ContentTypeForm(@NotBlank @Size(max = 40) String code, @NotBlank @Size(max = 80) String name,
                                String icon, String color, Integer sortOrder, Boolean active) {}
}
