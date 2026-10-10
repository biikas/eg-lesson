package np.eglesson.quiz;

import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "quiz_question")
@Getter
@Setter
public class QuizQuestion {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "quiz_id")
  private Quiz quiz;

  @Column(columnDefinition = "text")
  private String text;

  @Column(columnDefinition = "text")
  private String explanation;

  private int sortOrder;

  @OneToMany(mappedBy = "question", cascade = CascadeType.ALL, orphanRemoval = true)
  @OrderBy("sortOrder asc")
  private List<QuizOption> options = new ArrayList<>();
}
