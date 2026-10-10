package np.eglesson.media;

import jakarta.persistence.*;
import java.time.Instant;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "media")
@Getter
@Setter
public class Media {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  private String originalName;
  private String storedName;
  private String url;
  private String contentType;
  private long sizeBytes;
  private Long uploadedBy;
  private Instant createdAt = Instant.now();
}
