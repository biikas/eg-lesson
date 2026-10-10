package np.eglesson.content;

import jakarta.persistence.*;
import java.time.Instant;
import lombok.Getter;
import lombok.Setter;

/** What students searched for and how many results they got; zero-result terms tell the team what to write next. */
@Entity
@Table(name = "search_log")
@Getter
@Setter
public class SearchLog {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  private String term;
  private int results;
  private Long studentId;
  private Instant createdAt = Instant.now();
}
