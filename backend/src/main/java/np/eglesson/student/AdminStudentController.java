package np.eglesson.student;

import java.util.Locale;
import np.eglesson.audit.AuditService;
import np.eglesson.auth.AuthDtos.StudentRow;
import np.eglesson.catalog.CatalogService;
import np.eglesson.common.ApiException;
import np.eglesson.common.ApiResponse;
import np.eglesson.common.PageResponse;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/students")
@PreAuthorize("hasAuthority('PERM_STUDENTS')")
public class AdminStudentController {
  private final StudentRepository students;
  private final CatalogService catalog;
  private final AuditService audit;
  private final org.springframework.security.crypto.password.PasswordEncoder encoder;

  public AdminStudentController(StudentRepository students, CatalogService catalog, AuditService audit,
                                org.springframework.security.crypto.password.PasswordEncoder encoder) {
    this.students = students;
    this.catalog = catalog;
    this.audit = audit;
    this.encoder = encoder;
  }

  /** No SMS/email provider yet: a student who forgot their password contacts us and an admin sets a temporary one. */
  @PostMapping("/{id}/password")
  @Transactional
  public ApiResponse<Void> resetPassword(@PathVariable Long id, @RequestBody java.util.Map<String, String> body) {
    String pw = body.getOrDefault("password", "");
    if (pw.length() < 6 || pw.length() > 72) throw ApiException.badRequest("Password must be 6–72 characters.");
    Student s = students.findById(id).orElseThrow(() -> ApiException.notFound("Student"));
    s.setPasswordHash(encoder.encode(pw));
    audit.log("PASSWORD", "STUDENT", id, s.getFullName());
    return ApiResponse.message("Password reset. Share it with the student privately.");
  }

  @GetMapping
  @Transactional(readOnly = true)
  public ApiResponse<PageResponse<StudentRow>> list(@RequestParam(required = false) String q,
                                                    @RequestParam(defaultValue = "0") int page,
                                                    @RequestParam(defaultValue = "20") int size) {
    String like = q == null || q.isBlank() ? null : "%" + q.toLowerCase(Locale.ROOT).trim() + "%";
    var pg = students.search(like, PageRequest.of(Math.max(0, page), Math.min(size, 100), Sort.by(Sort.Direction.DESC, "createdAt")));
    return ApiResponse.ok(PageResponse.of(pg, s -> new StudentRow(s.getId(), s.getFullName(), s.getEmail(), s.getPhone(),
        s.getCourseNode() == null ? null : catalog.find(s.getCourseNode().getId()).map(n -> catalog.pathLabel(n.id())).orElse(null),
        s.getSchool(), s.getDistrict(), s.isActive(), s.getLastLoginAt(), s.getCreatedAt())));
  }

  @PatchMapping("/{id}")
  @Transactional
  public ApiResponse<Void> setActive(@PathVariable Long id, @RequestParam boolean active) {
    Student s = students.findById(id).orElseThrow(() -> ApiException.notFound("Student"));
    s.setActive(active);
    audit.log(active ? "UNBLOCK" : "BLOCK", "STUDENT", id, s.getFullName());
    return ApiResponse.message(active ? "Student unblocked" : "Student blocked");
  }
}
