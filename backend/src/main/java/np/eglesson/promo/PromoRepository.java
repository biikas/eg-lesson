package np.eglesson.promo;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PromoRepository extends JpaRepository<Promo, Long> {
  @Query("""
      select p from Promo p where p.active = true and p.placement = :placement
      and (p.startAt is null or p.startAt <= :now) and (p.endAt is null or p.endAt > :now)
      order by p.sortOrder asc, p.id desc
      """)
  List<Promo> live(@Param("placement") String placement, @Param("now") Instant now);

  List<Promo> findAllByOrderByPlacementAscSortOrderAscIdDesc();

  @Modifying
  @Query("update Promo p set p.impressions = p.impressions + 1 where p.id in :ids")
  int addImpressions(@Param("ids") Collection<Long> ids);

  @Modifying
  @Query("update Promo p set p.clicks = p.clicks + 1 where p.id = :id")
  int addClick(@Param("id") Long id);
}
