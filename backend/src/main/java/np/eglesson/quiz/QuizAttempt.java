package np.eglesson.quiz;

import jakarta.persistence.*;
import java.time.Instant;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "quiz_attempt")
@Getter
@Setter
public class QuizAttempt {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  private Long quizId;
  private Long studentId;
  private int score;
  private int total;
  private int durationSeconds;
  private Instant createdAt = Instant.now();
}
