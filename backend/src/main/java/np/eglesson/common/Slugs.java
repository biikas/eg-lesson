package np.eglesson.common;

import java.text.Normalizer;
import java.util.Locale;
import java.util.function.Predicate;

public final class Slugs {
  private Slugs() {}

  /** Lower-case ASCII slug; Devanagari-only titles fall back to "item" and get a numeric suffix from {@link #unique}. */
  public static String slugify(String input) {
    if (input == null) return "item";
    String s = Normalizer.normalize(input, Normalizer.Form.NFD).replaceAll("\\p{M}", "");
    s = s.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+", "-").replaceAll("(^-+|-+$)", "");
    if (s.length() > 150) s = s.substring(0, 150).replaceAll("-+$", "");
    return s.isEmpty() ? "item" : s;
  }

  /** {@code base}, or {@code base-2}, {@code base-3}... whichever is not taken. */
  public static String unique(String base, Predicate<String> taken) {
    if (!taken.test(base)) return base;
    for (int i = 2; ; i++) {
      String candidate = base + "-" + i;
      if (!taken.test(candidate)) return candidate;
    }
  }
}
