package np.eglesson.engage;

import java.time.LocalDate;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface StudentActivityDayRepository extends JpaRepository<StudentActivityDay, Long> {
  boolean existsByStudentIdAndActivityDay(Long studentId, LocalDate day);

  @Query("select d.activityDay from StudentActivityDay d where d.studentId = :sid and d.activityDay >= :from order by d.activityDay desc")
  List<LocalDate> daysSince(@Param("sid") Long studentId, @Param("from") LocalDate from);

  @Query("select count(distinct d.studentId) from StudentActivityDay d where d.activityDay = :day")
  long activeStudentsOn(@Param("day") LocalDate day);

  @Query("select d.activityDay, count(d) from StudentActivityDay d where d.activityDay >= :from group by d.activityDay order by d.activityDay")
  List<Object[]> activeStudentsSince(@Param("from") LocalDate from);
}
