package np.eglesson.quiz;

import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface QuizAttemptRepository extends JpaRepository<QuizAttempt, Long> {
  long countByStudentId(Long studentId);

  List<QuizAttempt> findByStudentIdOrderByCreatedAtDesc(Long studentId, Pageable pageable);

  List<QuizAttempt> findByStudentIdAndQuizIdOrderByCreatedAtDesc(Long studentId, Long quizId, Pageable pageable);

  @Query("select avg(a.score * 100.0 / a.total) from QuizAttempt a where a.studentId = :sid and a.total > 0")
  Double averagePercent(@Param("sid") Long studentId);
}
