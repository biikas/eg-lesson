package np.eglesson.quiz;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.Setter;
import np.eglesson.catalog.CatalogNode;

@Entity
@Table(name = "quiz")
@Getter
@Setter
public class Quiz {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  private String title;
  private String slug;
  private String description;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "node_id")
  private CatalogNode node;

  /** 0 = untimed practice. */
  private int timeLimitMinutes;

  /** DRAFT or PUBLISHED. */
  private String status = "DRAFT";
  private long attemptCount;
  private Long createdBy;
  private Instant createdAt = Instant.now();
  private Instant updatedAt = Instant.now();

  @OneToMany(mappedBy = "quiz", cascade = CascadeType.ALL, orphanRemoval = true)
  @OrderBy("sortOrder asc")
  private List<QuizQuestion> questions = new ArrayList<>();

  @PreUpdate
  void touch() {
    updatedAt = Instant.now();
  }
}
