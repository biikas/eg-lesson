package np.eglesson.content;

import jakarta.persistence.*;
import java.time.LocalDate;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "post_view_daily")
@Getter
@Setter
public class PostViewDaily {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  private Long postId;
  private LocalDate viewDate;
  private long views;
}
