package np.eglesson.engage;

import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReadingHistoryRepository extends JpaRepository<ReadingHistory, Long> {
  Optional<ReadingHistory> findByStudentIdAndPostId(Long studentId, Long postId);

  Page<ReadingHistory> findByStudentIdOrderByLastReadAtDesc(Long studentId, Pageable pageable);

  long countByStudentId(Long studentId);

  long countByStudentIdAndProgressGreaterThanEqual(Long studentId, int progress);
}
