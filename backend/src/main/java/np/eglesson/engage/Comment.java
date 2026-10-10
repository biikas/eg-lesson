package np.eglesson.engage;

import jakarta.persistence.*;
import java.time.Instant;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "post_comment")
@Getter
@Setter
public class Comment {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  private Long postId;
  private Long parentId;
  private Long studentId;
  private Long adminId;

  @Column(columnDefinition = "text")
  private String body;

  @Enumerated(EnumType.STRING)
  private CommentStatus status;

  private Instant createdAt = Instant.now();
}
