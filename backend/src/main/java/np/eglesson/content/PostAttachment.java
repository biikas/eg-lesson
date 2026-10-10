package np.eglesson.content;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

/** Downloadable file on a post (PDF of the note, question paper scan...). */
@Entity
@Table(name = "post_attachment")
@Getter
@Setter
public class PostAttachment {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "post_id")
  private Post post;

  private String title;
  private String url;
  private int sortOrder;
}
