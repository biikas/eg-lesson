package np.eglesson.content;

/** PUBLISHED with a future publishedAt is "scheduled": it goes live by itself at that time. */
public enum PostStatus {
  DRAFT,
  REVIEW,
  PUBLISHED,
  ARCHIVED
}
