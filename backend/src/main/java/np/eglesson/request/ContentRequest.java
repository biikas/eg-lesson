package np.eglesson.request;

import jakarta.persistence.*;
import java.time.Instant;
import lombok.Getter;
import lombok.Setter;

/** "Please add notes for…" from a student. The content team works through these. */
@Entity
@Table(name = "content_request")
@Getter
@Setter
public class ContentRequest {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  private Long studentId;
  private Long nodeId;
  private String topic;
  private String details;
  /** OPEN, IN_PROGRESS, DONE, REJECTED. */
  private String status = "OPEN";
  private String adminNote;
  private Long postId;
  private Instant createdAt = Instant.now();
  private Instant updatedAt = Instant.now();

  @PreUpdate
  void touch() {
    updatedAt = Instant.now();
  }
}
