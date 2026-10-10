package np.eglesson.engage;

import jakarta.persistence.*;
import java.time.LocalDate;
import lombok.Getter;
import lombok.Setter;

/** One row per student per Nepal calendar day with any learning activity; the streak counter reads these. */
@Entity
@Table(name = "student_activity_day")
@Getter
@Setter
public class StudentActivityDay {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  private Long studentId;
  private LocalDate activityDay;
}
