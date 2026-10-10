package np.eglesson.common;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;

public final class Times {
  public static final ZoneId NEPAL = ZoneId.of("Asia/Kathmandu");

  private Times() {}

  public static LocalDate todayNepal() {
    return LocalDate.now(NEPAL);
  }

  public static Instant startOfDayNepal(LocalDate day) {
    return day.atStartOfDay(NEPAL).toInstant();
  }
}
