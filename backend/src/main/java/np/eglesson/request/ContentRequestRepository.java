package np.eglesson.request;

import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ContentRequestRepository extends JpaRepository<ContentRequest, Long> {
  List<ContentRequest> findByStudentIdOrderByCreatedAtDesc(Long studentId);

  long countByStatus(String status);

  long countByStudentIdAndStatus(Long studentId, String status);

  @Query("select r from ContentRequest r where (:status is null or r.status = :status) order by r.createdAt desc")
  Page<ContentRequest> search(@Param("status") String status, Pageable pageable);
}
