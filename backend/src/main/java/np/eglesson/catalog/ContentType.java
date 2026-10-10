package np.eglesson.catalog;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

/** Kind of material: Notes, Solutions, Old Questions, Model Questions, Syllabus... Admin-defined. */
@Entity
@Table(name = "content_type")
@Getter
@Setter
public class ContentType {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  private String code;
  private String name;
  private String icon;
  private String color;
  private int sortOrder;
  private boolean active = true;
}
