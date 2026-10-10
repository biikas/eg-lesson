package np.eglesson.quiz;

import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface QuizRepository extends JpaRepository<Quiz, Long> {
  Optional<Quiz> findBySlug(String slug);

  boolean existsBySlug(String slug);

  long countByNodeId(Long nodeId);

  @Query("""
      select q from Quiz q where (:status is null or q.status = :status) and (:path is null or q.node.path like :path)
      and (:q is null or lower(q.title) like :q) order by q.createdAt desc
      """)
  Page<Quiz> search(@Param("status") String status, @Param("path") String pathPrefix, @Param("q") String likeLower, Pageable pageable);

  @Modifying
  @Query("update Quiz q set q.attemptCount = q.attemptCount + 1 where q.id = :id")
  int incrementAttempts(@Param("id") Long id);
}
