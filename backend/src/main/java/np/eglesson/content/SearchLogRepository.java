package np.eglesson.content;

import java.time.Instant;
import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SearchLogRepository extends JpaRepository<SearchLog, Long> {
  @Query("select s.term, count(s), max(s.results) from SearchLog s where s.createdAt >= :since group by s.term order by count(s) desc")
  List<Object[]> topTerms(@Param("since") Instant since, Pageable pageable);

  @Query("select s.term, count(s) from SearchLog s where s.createdAt >= :since and s.results = 0 group by s.term order by count(s) desc")
  List<Object[]> zeroResultTerms(@Param("since") Instant since, Pageable pageable);

  long countByCreatedAtAfter(Instant since);
}
