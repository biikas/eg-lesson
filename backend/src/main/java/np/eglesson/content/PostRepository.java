package np.eglesson.content;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PostRepository extends JpaRepository<Post, Long>, JpaSpecificationExecutor<Post> {
  Optional<Post> findBySlug(String slug);

  boolean existsBySlug(String slug);

  long countByNodeId(Long nodeId);

  long countByContentTypeId(Long contentTypeId);

  long countByStatus(PostStatus status);

  @Query("select p.node.id, count(p) from Post p where p.status = np.eglesson.content.PostStatus.PUBLISHED and p.publishedAt <= :now group by p.node.id")
  List<Object[]> liveCountsByNode(@Param("now") Instant now);

  @Query("select p.contentType.id, count(p) from Post p where p.status = np.eglesson.content.PostStatus.PUBLISHED and p.publishedAt <= :now and p.node.path like :prefix group by p.contentType.id")
  List<Object[]> liveCountsByTypeUnder(@Param("prefix") String pathPrefix, @Param("now") Instant now);

  @Query("""
      select p from Post p where p.status = np.eglesson.content.PostStatus.PUBLISHED and p.publishedAt <= :now
      and p.node.id = :nodeId order by p.publishedAt asc, p.id asc
      """)
  List<Post> liveInNode(@Param("nodeId") Long nodeId, @Param("now") Instant now);

  @Query("select coalesce(sum(p.viewCount), 0) from Post p")
  long totalViews();

  @Query("select p.author.id, p.author.fullName, count(p) from Post p where p.createdAt >= :since and p.author is not null group by p.author.id, p.author.fullName order by count(p) desc")
  List<Object[]> createdByAuthorSince(@Param("since") Instant since);

  @Query("select p from Post p where p.status = np.eglesson.content.PostStatus.PUBLISHED order by p.viewCount desc")
  List<Post> mostViewed(Pageable pageable);

  @Query("select count(p) from Post p where p.createdAt >= :since")
  long createdSince(@Param("since") Instant since);

  @Modifying
  @Query("update Post p set p.viewCount = p.viewCount + 1 where p.id = :id")
  int incrementViews(@Param("id") Long id);

  @Modifying
  @Query("update Post p set p.likeCount = p.likeCount + :delta where p.id = :id")
  int addLikes(@Param("id") Long id, @Param("delta") int delta);

  @Modifying
  @Query("update Post p set p.bookmarkCount = p.bookmarkCount + :delta where p.id = :id")
  int addBookmarks(@Param("id") Long id, @Param("delta") int delta);

  @Modifying
  @Query("update Post p set p.commentCount = :count where p.id = :id")
  int setCommentCount(@Param("id") Long id, @Param("count") int count);
}
