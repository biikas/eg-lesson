package np.eglesson.engage;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface BookmarkRepository extends JpaRepository<Bookmark, Long> {
  boolean existsByStudentIdAndPostId(Long studentId, Long postId);

  Page<Bookmark> findByStudentIdOrderByCreatedAtDesc(Long studentId, Pageable pageable);

  long countByStudentId(Long studentId);

  @Modifying
  @Query("delete from Bookmark b where b.studentId = :studentId and b.postId = :postId")
  int remove(@Param("studentId") Long studentId, @Param("postId") Long postId);
}
