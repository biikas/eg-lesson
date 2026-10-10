package np.eglesson.student;

import java.time.Instant;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface StudentRepository extends JpaRepository<Student, Long> {
  Optional<Student> findByEmailIgnoreCase(String email);

  Optional<Student> findByPhone(String phone);

  boolean existsByEmailIgnoreCase(String email);

  boolean existsByPhone(String phone);

  long countByCreatedAtAfter(Instant after);

  @Query("""
      select s from Student s where (:q is null or lower(s.fullName) like :q or lower(s.email) like :q or s.phone like :q)
      """)
  Page<Student> search(@Param("q") String q, Pageable pageable);
}
