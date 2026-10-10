package np.eglesson.quiz;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "quiz_option")
@Getter
@Setter
public class QuizOption {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "question_id")
  private QuizQuestion question;

  private String text;
  private boolean correct;
  private int sortOrder;
}
