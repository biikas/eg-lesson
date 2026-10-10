package np.eglesson.auth;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.EnumSet;
import java.util.Set;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "role")
@Getter
@Setter
public class Role {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  private String name;
  private String description;
  /** Built-in roles (Super Admin) cannot be deleted or stripped of permissions. */
  private boolean systemRole;

  @ElementCollection(fetch = FetchType.EAGER)
  @CollectionTable(name = "role_permission", joinColumns = @JoinColumn(name = "role_id"))
  @Column(name = "permission")
  @Enumerated(EnumType.STRING)
  private Set<Permission> permissions = EnumSet.noneOf(Permission.class);

  private Instant createdAt = Instant.now();
}
