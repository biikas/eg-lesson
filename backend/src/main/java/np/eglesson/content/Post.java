package np.eglesson.content;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import lombok.Getter;
import lombok.Setter;
import np.eglesson.auth.AdminUser;
import np.eglesson.catalog.CatalogNode;
import np.eglesson.catalog.ContentType;

@Entity
@Table(name = "post")
@Getter
@Setter
public class Post {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  private String title;
  private String slug;
  private String excerpt;

  @Column(columnDefinition = "longtext")
  private String body;

  /** Plain text of title, excerpt, tags, subject path and body; what search matches against. */
  @Column(columnDefinition = "mediumtext")
  private String searchText;

  private String coverImage;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "node_id")
  private CatalogNode node;

  @ManyToOne(fetch = FetchType.EAGER, optional = false)
  @JoinColumn(name = "content_type_id")
  private ContentType contentType;

  private String language = "EN";
  private String difficulty;
  private String videoUrl;

  @Enumerated(EnumType.STRING)
  private PostStatus status = PostStatus.DRAFT;

  private boolean featured;
  private boolean allowComments = true;
  private Instant publishedAt;
  private int readMinutes = 1;
  private String metaTitle;
  private String metaDescription;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "author_id")
  private AdminUser author;

  private long viewCount;
  private int likeCount;
  private int commentCount;
  private int bookmarkCount;
  private Instant createdAt = Instant.now();
  private Instant updatedAt = Instant.now();

  @ElementCollection
  @CollectionTable(name = "post_tag", joinColumns = @JoinColumn(name = "post_id"))
  @Column(name = "tag")
  private Set<String> tags = new LinkedHashSet<>();

  @OneToMany(mappedBy = "post", cascade = CascadeType.ALL, orphanRemoval = true)
  @OrderBy("sortOrder asc")
  private List<PostAttachment> attachments = new ArrayList<>();

  @PreUpdate
  void touch() {
    updatedAt = Instant.now();
  }

  public boolean isLive() {
    return status == PostStatus.PUBLISHED && publishedAt != null && !publishedAt.isAfter(Instant.now());
  }
}
