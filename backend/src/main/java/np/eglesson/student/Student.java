package np.eglesson.student;

import jakarta.persistence.*;
import java.time.Instant;
import lombok.Getter;
import lombok.Setter;
import np.eglesson.catalog.CatalogNode;

@Entity
@Table(name = "student")
@Getter
@Setter
public class Student {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  private String fullName;
  private String email;
  private String phone;
  private String passwordHash;

  /** The class/program/semester the student studies; drives the personalised home page. */
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "course_node_id")
  private CatalogNode courseNode;

  private String school;
  private String district;
  private String avatarColor;
  private boolean active = true;
  private Instant lastLoginAt;
  private Instant createdAt = Instant.now();
  private Instant updatedAt = Instant.now();

  @PreUpdate
  void touch() {
    updatedAt = Instant.now();
  }
}
