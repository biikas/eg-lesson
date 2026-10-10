package np.eglesson.settings;

import java.time.Instant;
import java.util.*;
import np.eglesson.audit.AuditService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Key/value site settings edited in the admin portal. Only known keys are accepted. */
@Service
public class SettingsService {
  /** Key → default value. Order is the order the admin form shows them in. */
  public static final Map<String, String> DEFAULTS = new LinkedHashMap<>();

  static {
    DEFAULTS.put("site.name", "eglesson");
    DEFAULTS.put("site.tagline", "Every note. Every subject. One place.");
    DEFAULTS.put("home.heroTitle", "Homework stuck? Find the note in seconds.");
    DEFAULTS.put("home.heroSubtitle", "Class 8 to Bachelor's — SEE, +2, Engineering, Medical, Management and more. Free, organised notes written for Nepali students.");
    DEFAULTS.put("contact.email", "hello@eglesson.com");
    DEFAULTS.put("contact.phone", "");
    DEFAULTS.put("social.facebook", "");
    DEFAULTS.put("social.youtube", "");
    DEFAULTS.put("social.tiktok", "");
    DEFAULTS.put("social.instagram", "");
    DEFAULTS.put("footer.about", "eglesson is a free learning library for students in Nepal. Notes, solutions, old questions and practice quizzes — organised by class, semester and subject.");
    DEFAULTS.put("comments.autoApprove", "true");
    DEFAULTS.put("signup.enabled", "true");
    DEFAULTS.put("theme.primary", "#6C3BFF");
  }

  /** Keys the public site may read (everything except internal switches is public). */
  private static final Set<String> PRIVATE = Set.of();

  private final SiteSettingRepository repo;
  private final AuditService audit;
  private volatile Map<String, String> cache;

  public SettingsService(SiteSettingRepository repo, AuditService audit) {
    this.repo = repo;
    this.audit = audit;
  }

  public Map<String, String> all() {
    Map<String, String> c = cache;
    if (c == null) {
      Map<String, String> m = new LinkedHashMap<>(DEFAULTS);
      repo.findAll().forEach(s -> {
        if (DEFAULTS.containsKey(s.getKey())) m.put(s.getKey(), s.getValue() == null ? "" : s.getValue());
      });
      cache = c = Collections.unmodifiableMap(m);
    }
    return c;
  }

  public Map<String, String> publicSettings() {
    Map<String, String> m = new LinkedHashMap<>(all());
    PRIVATE.forEach(m::remove);
    return m;
  }

  public String get(String key) {
    return all().get(key);
  }

  public boolean flag(String key) {
    return "true".equalsIgnoreCase(get(key));
  }

  @Transactional
  public Map<String, String> update(Map<String, String> values) {
    for (var e : values.entrySet()) {
      if (!DEFAULTS.containsKey(e.getKey())) continue;
      SiteSetting s = repo.findById(e.getKey()).orElseGet(() -> {
        SiteSetting n = new SiteSetting();
        n.setKey(e.getKey());
        return n;
      });
      s.setValue(e.getValue() == null ? "" : e.getValue().trim());
      s.setUpdatedAt(Instant.now());
      repo.save(s);
    }
    cache = null;
    audit.log("UPDATE", "SETTINGS", null, String.join(", ", values.keySet()));
    return all();
  }
}
