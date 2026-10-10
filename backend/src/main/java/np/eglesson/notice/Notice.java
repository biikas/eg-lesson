package np.eglesson.notice;

import jakarta.persistence.*;
import java.time.Instant;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "notice")
@Getter
@Setter
public class Notice {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  private String title;
  private String slug;

  @Column(columnDefinition = "mediumtext")
  private String body;

  /** EXAM, RESULT, ADMISSION, SCHOLARSHIP, GENERAL. */
  private String category;
  /** Important notices also scroll in the site-wide ticker. */
  private boolean important;
  private String attachmentUrl;
  private String attachmentName;
  /** Optional: only relevant to students of this stream/class (shown first to them). */
  private Long nodeId;
  private Instant publishAt = Instant.now();
  private Instant expireAt;
  private boolean active = true;
  private long viewCount;
  private Long createdBy;
  private Instant createdAt = Instant.now();
  private Instant updatedAt = Instant.now();

  @PreUpdate
  void touch() {
    updatedAt = Instant.now();
  }
}
