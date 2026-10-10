package np.eglesson.engage;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PostLikeRepository extends JpaRepository<PostLike, Long> {
  boolean existsByStudentIdAndPostId(Long studentId, Long postId);

  @Modifying
  @Query("delete from PostLike l where l.studentId = :studentId and l.postId = :postId")
  int remove(@Param("studentId") Long studentId, @Param("postId") Long postId);
}
