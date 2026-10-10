package np.eglesson.notice;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface NoticeRepository extends JpaRepository<Notice, Long> {
  Optional<Notice> findBySlug(String slug);

  boolean existsBySlug(String slug);

  @Query("""
      select n from Notice n where n.active = true and n.publishAt <= :now and (n.expireAt is null or n.expireAt > :now)
      and (:category is null or n.category = :category) order by n.important desc, n.publishAt desc
      """)
  Page<Notice> live(@Param("now") Instant now, @Param("category") String category, Pageable pageable);

  @Query("""
      select n from Notice n where n.active = true and n.important = true and n.publishAt <= :now
      and (n.expireAt is null or n.expireAt > :now) order by n.publishAt desc
      """)
  List<Notice> ticker(@Param("now") Instant now, Pageable pageable);

  @Query("select n from Notice n where (:q is null or lower(n.title) like :q) order by n.publishAt desc")
  Page<Notice> adminSearch(@Param("q") String likeLower, Pageable pageable);

  @Modifying
  @Query("update Notice n set n.viewCount = n.viewCount + 1 where n.id = :id")
  int incrementViews(@Param("id") Long id);
}
