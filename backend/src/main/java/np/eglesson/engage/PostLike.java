package np.eglesson.engage;

import jakarta.persistence.*;
import java.time.Instant;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "post_like")
@Getter
@Setter
public class PostLike {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  private Long studentId;
  private Long postId;
  private Instant createdAt = Instant.now();
}
