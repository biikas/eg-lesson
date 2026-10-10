package np.eglesson.content;

import jakarta.persistence.criteria.Predicate;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import org.springframework.data.jpa.domain.Specification;

/** Filters shared by the student listing/search and the admin post table. */
public final class PostSpecs {
  private PostSpecs() {}

  public record Filter(String q, String nodePath, Long nodeId, Long contentTypeId, String contentTypeCode,
                       String language, PostStatus status, Boolean scheduled, Long authorId, boolean liveOnly,
                       Boolean featured) {}

  /** Title matches first, then newest. Not applied to the count query. */
  public static Specification<Post> relevance(String q) {
    return (root, query, cb) -> {
      if (query.getResultType() != Long.class && query.getResultType() != long.class) {
        String like = "%" + q.toLowerCase(Locale.ROOT).trim() + "%";
        query.orderBy(cb.asc(cb.selectCase().when(cb.like(cb.lower(root.get("title")), like), 0).otherwise(1)),
            cb.desc(root.get("viewCount")), cb.desc(root.get("publishedAt")));
      }
      return null;
    };
  }

  public static Specification<Post> of(Filter f) {
    return (root, query, cb) -> {
      List<Predicate> ps = new ArrayList<>();
      if (f.liveOnly()) {
        ps.add(cb.equal(root.get("status"), PostStatus.PUBLISHED));
        ps.add(cb.lessThanOrEqualTo(root.get("publishedAt"), Instant.now()));
      }
      if (f.status() != null) ps.add(cb.equal(root.get("status"), f.status()));
      if (Boolean.TRUE.equals(f.scheduled())) ps.add(cb.greaterThan(root.get("publishedAt"), Instant.now()));
      if (f.nodePath() != null) ps.add(cb.like(root.get("node").get("path"), f.nodePath() + "%"));
      if (f.nodeId() != null) ps.add(cb.equal(root.get("node").get("id"), f.nodeId()));
      if (f.contentTypeId() != null) ps.add(cb.equal(root.get("contentType").get("id"), f.contentTypeId()));
      if (f.contentTypeCode() != null) ps.add(cb.equal(root.get("contentType").get("code"), f.contentTypeCode()));
      if (f.language() != null) ps.add(cb.equal(root.get("language"), f.language()));
      if (f.authorId() != null) ps.add(cb.equal(root.get("author").get("id"), f.authorId()));
      if (f.featured() != null) ps.add(cb.equal(root.get("featured"), f.featured()));
      if (f.q() != null && !f.q().isBlank()) {
        // Every word must appear somewhere (title, excerpt, tags, subject path or body).
        for (String word : f.q().toLowerCase(Locale.ROOT).trim().split("\\s+")) {
          if (word.isBlank()) continue;
          String like = "%" + word.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_") + "%";
          ps.add(cb.or(cb.like(cb.lower(root.get("title")), like), cb.like(root.get("searchText"), like)));
        }
      }
      return cb.and(ps.toArray(new Predicate[0]));
    };
  }
}
