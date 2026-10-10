package np.eglesson.catalog;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

/** A level in the catalog tree, e.g. Stream, Program, Class, Semester, Year, Subject, Chapter. Admin-defined. */
@Entity
@Table(name = "node_type")
@Getter
@Setter
public class NodeType {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  private String code;
  private String label;
  private String icon;
  private int sortOrder;
}
