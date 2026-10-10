package np.eglesson.engage;

import jakarta.persistence.*;
import java.time.Instant;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "reading_history")
@Getter
@Setter
public class ReadingHistory {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  private Long studentId;
  private Long postId;
  /** How far down the note the student scrolled, 0–100. Never decreases. */
  private int progress;
  private Instant lastReadAt = Instant.now();
}
