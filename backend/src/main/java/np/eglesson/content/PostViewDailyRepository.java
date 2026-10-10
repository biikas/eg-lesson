package np.eglesson.content;

import java.time.LocalDate;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PostViewDailyRepository extends JpaRepository<PostViewDaily, Long> {
  @Modifying
  @Query("update PostViewDaily v set v.views = v.views + 1 where v.postId = :postId and v.viewDate = :day")
  int increment(@Param("postId") Long postId, @Param("day") LocalDate day);

  @Query("select v.viewDate, sum(v.views) from PostViewDaily v where v.viewDate >= :from group by v.viewDate order by v.viewDate")
  List<Object[]> dailyTotals(@Param("from") LocalDate from);

  @Query("select coalesce(sum(v.views), 0) from PostViewDaily v where v.viewDate = :day")
  long totalOn(@Param("day") LocalDate day);

  @Query("select v.postId, sum(v.views) from PostViewDaily v where v.viewDate >= :from group by v.postId order by sum(v.views) desc")
  List<Object[]> topSince(@Param("from") LocalDate from, org.springframework.data.domain.Pageable pageable);

  @Query("select v.viewDate, v.views from PostViewDaily v where v.postId = :postId and v.viewDate >= :from order by v.viewDate")
  List<Object[]> forPost(@Param("postId") Long postId, @Param("from") LocalDate from);
}
