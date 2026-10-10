package np.eglesson.auth;

import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import np.eglesson.auth.AuthDtos.*;
import np.eglesson.catalog.CatalogNodeRepository;
import np.eglesson.catalog.CatalogService;
import np.eglesson.common.ApiException;
import np.eglesson.config.AuthPrincipal;
import np.eglesson.config.Current;
import np.eglesson.config.JwtService;
import np.eglesson.settings.SettingsService;
import np.eglesson.student.Student;
import np.eglesson.student.StudentRepository;
import np.eglesson.audit.AuditService;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {
  private static final List<String> AVATAR_COLORS = List.of("#6C3BFF", "#FF3D7F", "#00B8A9", "#FF8A00", "#2F80ED", "#9B51E0", "#27AE60", "#EB5757");

  private final AdminUserRepository admins;
  private final StudentRepository students;
  private final CatalogNodeRepository nodes;
  private final CatalogService catalog;
  private final PasswordEncoder encoder;
  private final JwtService jwt;
  private final SettingsService settings;
  private final AuditService audit;
  /** Failed sign-ins per login name; 8 failures lock that name for 15 minutes. In-memory, per server. */
  private final Map<String, int[]> failures = new ConcurrentHashMap<>();
  private final Map<String, Long> lockedUntil = new ConcurrentHashMap<>();

  public AuthService(AdminUserRepository admins, StudentRepository students, CatalogNodeRepository nodes,
                     CatalogService catalog, PasswordEncoder encoder, JwtService jwt, SettingsService settings,
                     AuditService audit) {
    this.admins = admins;
    this.students = students;
    this.nodes = nodes;
    this.catalog = catalog;
    this.encoder = encoder;
    this.jwt = jwt;
    this.settings = settings;
    this.audit = audit;
  }

  private void checkLock(String key) {
    Long until = lockedUntil.get(key);
    if (until != null && until > System.currentTimeMillis()) {
      throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, "Too many attempts. Try again in 15 minutes.");
    }
  }

  private void fail(String key) {
    int[] n = failures.computeIfAbsent(key, k -> new int[1]);
    synchronized (n) {
      if (++n[0] >= 8) {
        lockedUntil.put(key, System.currentTimeMillis() + 15 * 60_000);
        n[0] = 0;
      }
    }
  }

  // ------------------------------------------------------------------ admins

  public AdminMe adminMe(AdminUser a) {
    return new AdminMe(a.getId(), a.getUsername(), a.getFullName(), a.getEmail(), a.getRole().getName(),
        a.getRole().getPermissions(), a.isMustChangePassword());
  }

  @Transactional
  public AdminSession adminLogin(AdminLogin req) {
    String key = "a:" + req.username().toLowerCase(Locale.ROOT);
    checkLock(key);
    AdminUser a = admins.findByUsernameIgnoreCase(req.username().trim()).orElse(null);
    if (a == null || !encoder.matches(req.password(), a.getPasswordHash())) {
      fail(key);
      throw ApiException.unauthorized("Wrong username or password.");
    }
    if (!a.isActive()) throw ApiException.forbidden("This account is disabled.");
    failures.remove(key);
    a.setLastLoginAt(Instant.now());
    return new AdminSession(jwt.issue(new AuthPrincipal(a.getId(), AuthPrincipal.ADMIN, a.getFullName())), adminMe(a));
  }

  @Transactional(readOnly = true)
  public AdminMe currentAdmin() {
    return adminMe(admins.findById(Current.admin().id()).orElseThrow(() -> ApiException.unauthorized("Please sign in.")));
  }

  @Transactional
  public AdminMe changeAdminPassword(ChangePassword req) {
    AdminUser a = admins.findById(Current.admin().id()).orElseThrow();
    if (!encoder.matches(req.currentPassword(), a.getPasswordHash())) throw ApiException.badRequest("Current password is wrong.");
    if (req.currentPassword().equals(req.newPassword())) throw ApiException.badRequest("Choose a new password different from the current one.");
    a.setPasswordHash(encoder.encode(req.newPassword()));
    a.setMustChangePassword(false);
    audit.log("PASSWORD", "ADMIN_USER", a.getId(), a.getUsername());
    return adminMe(a);
  }

  // ------------------------------------------------------------------ students

  public StudentMe studentMe(Student s) {
    var course = s.getCourseNode() == null ? null : catalog.find(s.getCourseNode().getId()).orElse(null);
    return new StudentMe(s.getId(), s.getFullName(), s.getEmail(), s.getPhone(), course == null ? null : course.id(),
        course == null ? null : course.slug(), course == null ? null : catalog.pathLabel(course.id()), s.getSchool(),
        s.getDistrict(), s.getAvatarColor(), s.getCreatedAt());
  }

  @Transactional
  public StudentSession register(StudentRegister req) {
    if (!settings.flag("signup.enabled")) throw ApiException.forbidden("Sign-ups are paused right now.");
    String email = req.email() == null || req.email().isBlank() ? null : req.email().trim().toLowerCase(Locale.ROOT);
    String phone = req.phone() == null || req.phone().isBlank() ? null : req.phone().trim();
    if (email == null && phone == null) throw ApiException.badRequest("Enter your email or mobile number.");
    if (email != null && students.existsByEmailIgnoreCase(email)) throw ApiException.conflict("This email already has an account. Sign in instead.");
    if (phone != null && students.existsByPhone(phone)) throw ApiException.conflict("This mobile number already has an account. Sign in instead.");
    Student s = new Student();
    s.setFullName(req.fullName().trim());
    s.setEmail(email);
    s.setPhone(phone);
    s.setPasswordHash(encoder.encode(req.password()));
    if (req.courseNodeId() != null) s.setCourseNode(nodes.findById(req.courseNodeId()).orElse(null));
    s.setAvatarColor(AVATAR_COLORS.get((int) (Math.random() * AVATAR_COLORS.size())));
    s.setLastLoginAt(Instant.now());
    students.save(s);
    return new StudentSession(jwt.issue(new AuthPrincipal(s.getId(), AuthPrincipal.STUDENT, s.getFullName())), studentMe(s));
  }

  @Transactional
  public StudentSession studentLogin(StudentLogin req) {
    String login = req.login().trim().toLowerCase(Locale.ROOT);
    String key = "s:" + login;
    checkLock(key);
    Student s = (login.contains("@") ? students.findByEmailIgnoreCase(login) : students.findByPhone(login)).orElse(null);
    if (s == null || !encoder.matches(req.password(), s.getPasswordHash())) {
      fail(key);
      throw ApiException.unauthorized("Wrong email/mobile or password.");
    }
    if (!s.isActive()) throw ApiException.forbidden("This account is blocked. Contact us if this is a mistake.");
    failures.remove(key);
    s.setLastLoginAt(Instant.now());
    return new StudentSession(jwt.issue(new AuthPrincipal(s.getId(), AuthPrincipal.STUDENT, s.getFullName())), studentMe(s));
  }

  @Transactional(readOnly = true)
  public StudentMe currentStudent() {
    return studentMe(students.findById(Current.student().id()).orElseThrow(() -> ApiException.unauthorized("Please sign in.")));
  }

  @Transactional
  public StudentMe updateProfile(StudentProfile req) {
    Student s = students.findById(Current.student().id()).orElseThrow();
    s.setFullName(req.fullName().trim());
    s.setCourseNode(req.courseNodeId() == null ? null : nodes.findById(req.courseNodeId()).orElseThrow(() -> ApiException.badRequest("Course not found")));
    s.setSchool(req.school() == null || req.school().isBlank() ? null : req.school().trim());
    s.setDistrict(req.district() == null || req.district().isBlank() ? null : req.district().trim());
    return studentMe(s);
  }

  @Transactional
  public void changeStudentPassword(ChangePassword req) {
    Student s = students.findById(Current.student().id()).orElseThrow();
    if (!encoder.matches(req.currentPassword(), s.getPasswordHash())) throw ApiException.badRequest("Current password is wrong.");
    s.setPasswordHash(encoder.encode(req.newPassword()));
  }
}
