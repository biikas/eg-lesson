package np.eglesson.audit;

import jakarta.persistence.*;
import java.time.Instant;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "audit_log")
@Getter
@Setter
public class AuditLog {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  private Long adminId;
  private String adminName;
  private String action;
  private String entity;
  private Long entityId;
  private String summary;
  private Instant createdAt = Instant.now();
}
