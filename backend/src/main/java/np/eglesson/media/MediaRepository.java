package np.eglesson.media;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface MediaRepository extends JpaRepository<Media, Long> {
  @Query("""
      select m from Media m where (:type is null or m.contentType like :type) and (:q is null or lower(m.originalName) like :q)
      order by m.createdAt desc
      """)
  Page<Media> search(@Param("type") String typePrefix, @Param("q") String likeLower, Pageable pageable);
}
