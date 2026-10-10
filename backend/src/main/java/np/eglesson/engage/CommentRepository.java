package np.eglesson.engage;

import java.time.Instant;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CommentRepository extends JpaRepository<Comment, Long> {
  List<Comment> findByPostIdAndStatusOrderByCreatedAtAsc(Long postId, CommentStatus status);

  long countByPostIdAndStatus(Long postId, CommentStatus status);

  long countByStatus(CommentStatus status);

  long countByCreatedAtAfter(Instant after);

  @Query("""
      select c from Comment c where (:status is null or c.status = :status) and (:postId is null or c.postId = :postId)
      order by c.createdAt desc
      """)
  Page<Comment> search(@Param("status") CommentStatus status, @Param("postId") Long postId, Pageable pageable);
}
