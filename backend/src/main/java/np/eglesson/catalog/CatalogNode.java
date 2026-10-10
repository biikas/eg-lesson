package np.eglesson.catalog;

import jakarta.persistence.*;
import java.time.Instant;
import lombok.Getter;
import lombok.Setter;

/**
 * One node of the browse tree: "SEE" → "Class 10" → "Science", or "Engineering" → "BE Computer" → "Semester 3" →
 * "Data Structures". {@code path} is the materialised id path ("/1/4/19/") used to fetch a whole subtree.
 */
@Entity
@Table(name = "catalog_node")
@Getter
@Setter
public class CatalogNode {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "parent_id")
  private CatalogNode parent;

  @ManyToOne(fetch = FetchType.EAGER, optional = false)
  @JoinColumn(name = "node_type_id")
  private NodeType nodeType;

  private String name;
  private String shortName;
  private String slug;
  private String description;
  private String icon;
  private String color;
  private String coverImage;
  private String path = "/";
  private int depth;
  private int sortOrder;
  private boolean active = true;
  private boolean featured;
  private Instant createdAt = Instant.now();
  private Instant updatedAt = Instant.now();

  @PreUpdate
  void touch() {
    updatedAt = Instant.now();
  }

  public Long getParentId() {
    return parent == null ? null : parent.getId();
  }
}
