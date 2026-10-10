package np.eglesson.promo;

import jakarta.persistence.*;
import java.time.Instant;
import lombok.Getter;
import lombok.Setter;

/** A banner (our own announcements, campaigns) or an advertisement (paid, tracked by impressions and clicks). */
@Entity
@Table(name = "promo")
@Getter
@Setter
public class Promo {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  /** BANNER or AD. */
  private String kind;
  private String title;
  private String subtitle;
  private String imageUrl;
  private String linkUrl;
  private String ctaText;
  /** Where on the site it shows: see {@link PromoService#PLACEMENTS}. */
  private String placement;
  /** CSS background (colour or gradient) for text-only banners. */
  private String bgColor;
  /** Optional: only shown on pages inside this stream/class/subject. */
  private Long nodeId;
  private Instant startAt;
  private Instant endAt;
  private int sortOrder;
  private boolean active = true;
  private long impressions;
  private long clicks;
  private Instant createdAt = Instant.now();
  private Instant updatedAt = Instant.now();

  @PreUpdate
  void touch() {
    updatedAt = Instant.now();
  }
}
