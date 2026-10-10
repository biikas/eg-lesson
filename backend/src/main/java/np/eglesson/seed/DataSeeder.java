package np.eglesson.seed;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import np.eglesson.auth.*;
import np.eglesson.catalog.*;
import np.eglesson.config.AppProperties;
import np.eglesson.config.AuthPrincipal;
import np.eglesson.content.PostDtos.PostForm;
import np.eglesson.content.PostRepository;
import np.eglesson.content.PostService;
import np.eglesson.content.PostStatus;
import np.eglesson.notice.NoticeService;
import np.eglesson.notice.NoticeService.NoticeForm;
import np.eglesson.promo.PromoService;
import np.eglesson.promo.PromoService.PromoForm;
import np.eglesson.quiz.QuizDtos.*;
import np.eglesson.quiz.QuizService;
import np.eglesson.seed.CatalogSeed.N;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionTemplate;

/** First start only: roles, the bootstrap super admin, the catalog and (dev) sample content. Never touches existing data. */
@Component
public class DataSeeder implements ApplicationRunner {
  private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

  private final AppProperties props;
  private final RoleRepository roles;
  private final AdminUserRepository admins;
  private final PasswordEncoder encoder;
  private final NodeTypeRepository nodeTypes;
  private final ContentTypeRepository contentTypes;
  private final CatalogNodeRepository nodes;
  private final CatalogService catalog;
  private final PostRepository posts;
  private final PostService postService;
  private final NoticeService notices;
  private final PromoService promos;
  private final QuizService quizzes;
  private final TransactionTemplate tx;

  public DataSeeder(AppProperties props, RoleRepository roles, AdminUserRepository admins, PasswordEncoder encoder,
                    NodeTypeRepository nodeTypes, ContentTypeRepository contentTypes, CatalogNodeRepository nodes,
                    CatalogService catalog, PostRepository posts, PostService postService, NoticeService notices,
                    PromoService promos, QuizService quizzes, TransactionTemplate tx) {
    this.props = props;
    this.roles = roles;
    this.admins = admins;
    this.encoder = encoder;
    this.nodeTypes = nodeTypes;
    this.contentTypes = contentTypes;
    this.nodes = nodes;
    this.catalog = catalog;
    this.posts = posts;
    this.postService = postService;
    this.notices = notices;
    this.promos = promos;
    this.quizzes = quizzes;
    this.tx = tx;
  }

  @Override
  public void run(ApplicationArguments args) {
    tx.executeWithoutResult(s -> seedRolesAndAdmin());
    if (props.seed().catalog() && nodes.count() == 0) {
      tx.executeWithoutResult(s -> seedCatalog());
      catalog.invalidate();
      log.info("Seeded catalog: {} categories", nodes.count());
    }
    if (props.seed().demoContent() && posts.count() == 0 && nodes.count() > 0) {
      AdminUser admin = admins.findAll().get(0);
      var auth = new UsernamePasswordAuthenticationToken(new AuthPrincipal(admin.getId(), AuthPrincipal.ADMIN, admin.getFullName()), null,
          Arrays.stream(Permission.values()).map(p -> new SimpleGrantedAuthority("PERM_" + p.name())).toList());
      SecurityContextHolder.getContext().setAuthentication(auth);
      try {
        seedDemo();
        log.info("Seeded demo posts, notices, banners and quizzes");
      } finally {
        SecurityContextHolder.clearContext();
      }
    }
  }

  // ------------------------------------------------------------------ roles & admin

  private void seedRolesAndAdmin() {
    if (roles.count() == 0) {
      role("Super Admin", "Everything, including admins and settings", true, EnumSet.allOf(Permission.class));
      role("Content Manager", "Runs the content team: publishes, organises the catalog, notices and banners", false,
          EnumSet.of(Permission.DASHBOARD, Permission.CONTENT_WRITE, Permission.CONTENT_PUBLISH, Permission.CATALOG,
              Permission.COMMENTS, Permission.NOTICES, Permission.PROMOS, Permission.QUIZZES, Permission.REQUESTS));
      role("Content Writer", "Writes notes and quizzes; posts go to review before publishing", false,
          EnumSet.of(Permission.CONTENT_WRITE, Permission.QUIZZES, Permission.REQUESTS));
      role("Moderator", "Keeps comments clean and helps students", false,
          EnumSet.of(Permission.COMMENTS, Permission.STUDENTS, Permission.REQUESTS));
    }
    if (admins.count() == 0) {
      String password = props.admin().bootstrapPassword();
      boolean generated = password == null || password.isBlank();
      if (generated) password = randomPassword();
      AdminUser a = new AdminUser();
      a.setUsername(props.admin().bootstrapUsername());
      a.setFullName("Super Admin");
      a.setPasswordHash(encoder.encode(password));
      a.setRole(roles.findByName("Super Admin").orElseThrow());
      a.setMustChangePassword(true);
      admins.save(a);
      if (generated) {
        log.warn("Created admin '{}' with one-time password: {}  (must be changed at first sign-in)", a.getUsername(), password);
      } else {
        log.info("Created admin '{}' from APP_ADMIN_PASSWORD (must be changed at first sign-in)", a.getUsername());
      }
    }
  }

  private void role(String name, String description, boolean system, Set<Permission> perms) {
    Role r = new Role();
    r.setName(name);
    r.setDescription(description);
    r.setSystemRole(system);
    r.setPermissions(EnumSet.copyOf(perms));
    roles.save(r);
  }

  private static String randomPassword() {
    String chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
    SecureRandom r = new SecureRandom();
    StringBuilder sb = new StringBuilder();
    for (int i = 0; i < 14; i++) sb.append(chars.charAt(r.nextInt(chars.length())));
    return sb.toString();
  }

  // ------------------------------------------------------------------ catalog

  private void seedCatalog() {
    if (nodeTypes.count() == 0) {
      String[][] types = {
          {"STREAM", "Stream", "bi-grid-3x3-gap"}, {"FACULTY", "Faculty", "bi-diagram-3"}, {"PROGRAM", "Program", "bi-mortarboard"},
          {"CLASS", "Class", "bi-easel"}, {"SEMESTER", "Semester", "bi-calendar3"}, {"YEAR", "Year", "bi-calendar-range"},
          {"EXAM", "Exam", "bi-trophy"}, {"SUBJECT", "Subject", "bi-book"}, {"CHAPTER", "Chapter", "bi-bookmark"}};
      for (int i = 0; i < types.length; i++) {
        NodeType t = new NodeType();
        t.setCode(types[i][0]);
        t.setLabel(types[i][1]);
        t.setIcon(types[i][2]);
        t.setSortOrder(i);
        nodeTypes.save(t);
      }
    }
    if (contentTypes.count() == 0) {
      String[][] cts = {
          {"NOTES", "Notes", "bi-journal-text", "#6C3BFF"}, {"SOLUTION", "Exercise Solutions", "bi-check2-square", "#00B8A9"},
          {"OLD_QUESTION", "Old Questions", "bi-archive", "#FF8A00"}, {"MODEL_QUESTION", "Model Questions", "bi-file-earmark-text", "#2F80ED"},
          {"IMPORTANT", "Important Questions", "bi-star", "#FF3D7F"}, {"FORMULA", "Formula Sheets", "bi-calculator", "#9B51E0"},
          {"SYLLABUS", "Syllabus", "bi-list-check", "#27AE60"}, {"LAB", "Lab & Practicals", "bi-clipboard-data", "#B7791F"},
          {"VIDEO", "Video Lessons", "bi-play-btn", "#EB5757"}};
      for (int i = 0; i < cts.length; i++) {
        ContentType c = new ContentType();
        c.setCode(cts[i][0]);
        c.setName(cts[i][1]);
        c.setIcon(cts[i][2]);
        c.setColor(cts[i][3]);
        c.setSortOrder(i);
        contentTypes.save(c);
      }
    }
    Map<String, NodeType> typeMap = new HashMap<>();
    nodeTypes.findAll().forEach(t -> typeMap.put(t.getCode(), t));
    Set<String> slugs = new HashSet<>();
    List<N> tree = CatalogSeed.tree();
    for (int i = 0; i < tree.size(); i++) create(tree.get(i), null, null, "", i, typeMap, slugs, tree.get(i).color());
  }

  /** Hand-picked slugs where the generated ones would be awkward. Keyed by the name path. */
  private static final Map<String, String> SLUG_OVERRIDES = Map.of(
      "+2 (NEB)", "plus-two",
      "+2 (NEB)/Science", "plus-two-science",
      "+2 (NEB)/Management", "plus-two-management",
      "+2 (NEB)/Science/Grade 11", "grade-11-science",
      "+2 (NEB)/Science/Grade 12", "grade-12-science",
      "+2 (NEB)/Management/Grade 11", "grade-11-management",
      "+2 (NEB)/Management/Grade 12", "grade-12-management");

  private static final Set<String> PERIODS = Set.of("CLASS", "SEMESTER", "YEAR");
  private static final Set<String> SHORT_PARENTS = Set.of("CLASS", "STREAM", "EXAM");

  /**
   * Readable, unique slugs: "class-8-nepali", "see-english", "be-computer-semester-i", "engineering-mathematics-i".
   * Periods under a program are prefixed with it; subjects under a class/stream/exam are prefixed with it; anything
   * else only gets its parent's prefix when the plain name is already taken.
   */
  private void create(N n, CatalogNode parent, String parentType, String parentPath, int order, Map<String, NodeType> types, Set<String> slugs, String color) {
    CatalogNode c = new CatalogNode();
    c.setParent(parent);
    c.setNodeType(types.get(n.type()));
    c.setName(n.name());
    c.setShortName(n.shortName());
    c.setDescription(n.description());
    c.setIcon(n.icon() != null ? n.icon() : "SUBJECT".equals(n.type()) ? CatalogSeed.subjectIcon(n.name()) : null);
    c.setColor(n.color() != null ? n.color() : color);
    c.setFeatured(n.featured());
    c.setSortOrder(order);
    c.setDepth(parent == null ? 0 : parent.getDepth() + 1);
    String base = np.eglesson.common.Slugs.slugify(n.name());
    boolean prefix = parent != null && ((PERIODS.contains(n.type()) && !"STREAM".equals(parentType))
        || ("SUBJECT".equals(n.type()) && SHORT_PARENTS.contains(parentType)) || slugs.contains(base));
    String namePath = parentPath.isEmpty() ? n.name() : parentPath + "/" + n.name();
    String slug = SLUG_OVERRIDES.getOrDefault(namePath, prefix ? parent.getSlug() + "-" + base : base);
    slug = np.eglesson.common.Slugs.unique(slug, slugs::contains);
    slugs.add(slug);
    c.setSlug(slug);
    c.setPath("/");
    nodes.save(c);
    c.setPath((parent == null ? "/" : parent.getPath()) + c.getId() + "/");
    for (int i = 0; i < n.children().size(); i++) create(n.children().get(i), c, n.type(), namePath, i, types, slugs, c.getColor());
  }

  // ------------------------------------------------------------------ demo content (development)

  private Long nodeId(String slug) {
    return nodes.findBySlug(slug).map(CatalogNode::getId).orElseThrow(() -> new IllegalStateException("seed slug missing: " + slug));
  }

  private Long typeId(String code) {
    return contentTypes.findByCode(code).orElseThrow().getId();
  }

  private void post(String title, String node, String type, String lang, String difficulty, boolean featured, String video,
                    List<String> tags, String body, int daysAgo) {
    postService.save(null, new PostForm(title, null, null, body, null, nodeId(node), typeId(type), lang, difficulty, video,
        PostStatus.PUBLISHED, featured, true, Instant.now().minus(daysAgo, ChronoUnit.DAYS).minus(daysAgo * 37L, ChronoUnit.MINUTES),
        null, null, tags, List.of()));
  }

  private void seedDemo() {
    post("Force and Motion — Complete Notes", "class-10-science-and-technology", "NOTES", "EN", "INTERMEDIATE", true, null,
        List.of("force", "motion", "newton", "see"), DemoBodies.FORCE, 1);
    post("Sets — Exercise 1.1 Solutions (Venn Diagram Problems)", "see-compulsory-mathematics", "SOLUTION", "EN", "BASIC", true, null,
        List.of("sets", "venn diagram", "exercise 1.1"), DemoBodies.SETS, 2);
    post("Limits and Continuity — Engineering Mathematics I", "engineering-mathematics-i", "NOTES", "EN", "ADVANCED", true,
        "https://www.youtube.com/watch?v=riXcZT2ICjA", List.of("limits", "continuity", "calculus"), DemoBodies.LIMITS, 3);
    post("Arrays and Pointers in C, Explained Simply", "computer-programming-c", "NOTES", "EN", "INTERMEDIATE", false, null,
        List.of("c", "pointers", "arrays", "programming"), DemoBodies.POINTERS, 4);
    post("Units and Dimensions — Grade 11 Physics", "grade-11-science-physics", "NOTES", "EN", "BASIC", false, null,
        List.of("units", "dimensions", "si units"), DemoBodies.UNITS, 5);
    post("SEE English 2080 — Solved Question Paper", "see-english", "OLD_QUESTION", "EN", "INTERMEDIATE", false, null,
        List.of("2080", "see", "solved"), DemoBodies.ENGLISH_OLD, 6);
    post("Stack and Queue — Data Structure and Algorithm", "data-structure-and-algorithm", "NOTES", "EN", "INTERMEDIATE", false, null,
        List.of("stack", "queue", "dsa"), DemoBodies.STACK, 7);
    post("नाम र सर्वनाम — कक्षा ८ नेपाली व्याकरण", "class-8-nepali", "NOTES", "NE", "BASIC", false, null,
        List.of("व्याकरण", "नाम", "सर्वनाम", "grammar"), DemoBodies.NEPALI, 8);
    post("Physics Formula Sheet — Mechanics (Grade 11)", "grade-11-science-physics", "FORMULA", "EN", "BASIC", false, null,
        List.of("formula", "mechanics"), DemoBodies.FORMULAS, 9);

    Instant now = Instant.now();
    notices.save(null, new NoticeForm("SEE 2083 exam routine published", "<p>The National Examinations Board has published the SEE 2083 routine. Exams start on <strong>Chaitra 15</strong>. Download the full routine below and plan your revision with our <a href=\"/explore/see\">SEE notes</a>.</p>",
        "EXAM", true, null, null, null, now.minus(1, ChronoUnit.DAYS), null, true));
    notices.save(null, new NoticeForm("IOE entrance application form is open", "<p>Applications for the IOE entrance exam are open until the end of the month. Practise with our <a href=\"/quizzes\">entrance quizzes</a>.</p>",
        "ADMISSION", false, null, null, null, now.minus(3, ChronoUnit.DAYS), null, true));
    notices.save(null, new NoticeForm("Grade 12 results: how to check with your symbol number", "<p>Results are published on the NEB website. Keep your symbol number and date of birth ready.</p>",
        "RESULT", false, null, null, null, now.minus(6, ChronoUnit.DAYS), null, true));

    promos.save(null, new PromoForm("BANNER", "SEE 2083 is coming. Revise smarter.", "Old questions, model sets and chapter-wise notes for every SEE subject.",
        null, "/explore/see", "Start revising", "HOME_HERO", "linear-gradient(120deg,#FF3D7F 0%,#FF8A00 100%)", null, null, null, 0, true));
    promos.save(null, new PromoForm("BANNER", "Engineering? We've got every semester.", "BE Computer & Civil notes, solutions and past papers — organised by semester.",
        null, "/explore/engineering-ioe", "Explore IOE", "HOME_HERO", "linear-gradient(120deg,#6C3BFF 0%,#2F80ED 100%)", null, null, null, 1, true));
    promos.save(null, new PromoForm("AD", "Your ad here — reach thousands of students", "Advertise your institute, books or classes to the right students by class and stream.",
        null, "mailto:hello@eglesson.com", "Advertise", "HOME_STRIP", "linear-gradient(120deg,#0F172A 0%,#334155 100%)", null, null, null, 0, true));
    promos.save(null, new PromoForm("AD", "Bridge course for +2 Science", "Kathmandu & online batches. Limited seats.",
        null, "/notices", "Learn more", "SIDEBAR", "linear-gradient(160deg,#00B8A9 0%,#2F80ED 100%)", null, null, null, 0, true));

    quizzes.save(null, new QuizForm("Force & Motion — 5 quick MCQs", "Check your understanding of Newton's laws before the SEE.", nodeId("class-10-science-and-technology"), 5, "PUBLISHED", List.of(
        q("The SI unit of force is", "Newton is defined as kg·m/s².", "Newton", "Joule", "Watt", "Pascal"),
        q("A body continues in its state of rest or uniform motion unless acted upon by an external force. This is", "This is Newton's first law, the law of inertia.", "Newton's first law", "Newton's second law", "Newton's third law", "Law of gravitation"),
        q("If a 2 kg mass accelerates at 3 m/s², the force on it is", "F = ma = 2 × 3 = 6 N.", "6 N", "5 N", "1.5 N", "9 N"),
        q("Acceleration due to gravity on Earth is approximately", "g ≈ 9.8 m/s² near the surface.", "9.8 m/s²", "1.6 m/s²", "98 m/s²", "0.98 m/s²"),
        q("Rocket propulsion is an example of", "Exhaust gases are pushed back, the rocket is pushed forward.", "Newton's third law", "Newton's first law", "Archimedes' principle", "Pascal's law"))));
    quizzes.save(null, new QuizForm("C Programming Basics", "Warm-up questions for Semester I C programming.", nodeId("computer-programming-c"), 0, "PUBLISHED", List.of(
        q("Which of these is the correct way to declare a pointer to int?", "The asterisk goes with the declarator: int *p;", "int *p;", "int p*;", "pointer int p;", "int &p;"),
        q("What does sizeof(char) return in C?", "sizeof(char) is 1 by definition.", "1", "2", "4", "Depends on compiler"),
        q("Which function allocates memory dynamically?", "malloc() reserves bytes on the heap.", "malloc()", "alloc()", "new()", "memory()"),
        q("Array indices in C start at", "C arrays are zero-indexed.", "0", "1", "-1", "Any value"))));
  }

  private static QuestionForm q(String text, String explanation, String correct, String... wrong) {
    List<OptionForm> opts = new ArrayList<>();
    opts.add(new OptionForm(correct, true));
    for (String w : wrong) opts.add(new OptionForm(w, false));
    Collections.shuffle(opts, new Random(text.hashCode()));
    return new QuestionForm(text, explanation, opts);
  }
}
