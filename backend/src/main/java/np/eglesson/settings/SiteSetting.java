package np.eglesson.settings;

import jakarta.persistence.*;
import java.time.Instant;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "site_setting")
@Getter
@Setter
public class SiteSetting {
  @Id
  @Column(name = "setting_key")
  private String key;

  @Column(name = "setting_value", columnDefinition = "text")
  private String value;

  private Instant updatedAt = Instant.now();
}
