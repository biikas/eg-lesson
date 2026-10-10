package np.eglesson.auth;

import jakarta.validation.Valid;
import np.eglesson.auth.AuthDtos.*;
import np.eglesson.common.ApiResponse;
import org.springframework.web.bind.annotation.*;

@RestController
public class AuthController {
  private final AuthService auth;

  public AuthController(AuthService auth) {
    this.auth = auth;
  }

  @PostMapping("/api/auth/admin/login")
  public ApiResponse<AdminSession> adminLogin(@Valid @RequestBody AdminLogin req) {
    return ApiResponse.ok(auth.adminLogin(req));
  }

  @GetMapping("/api/admin/me")
  public ApiResponse<AdminMe> adminMe() {
    return ApiResponse.ok(auth.currentAdmin());
  }

  @PostMapping("/api/admin/me/password")
  public ApiResponse<AdminMe> adminPassword(@Valid @RequestBody ChangePassword req) {
    return ApiResponse.ok("Password changed", auth.changeAdminPassword(req));
  }

  @PostMapping("/api/auth/student/register")
  public ApiResponse<StudentSession> register(@Valid @RequestBody StudentRegister req) {
    return ApiResponse.ok("Welcome aboard!", auth.register(req));
  }

  @PostMapping("/api/auth/student/login")
  public ApiResponse<StudentSession> studentLogin(@Valid @RequestBody StudentLogin req) {
    return ApiResponse.ok(auth.studentLogin(req));
  }

  @GetMapping("/api/student/me")
  public ApiResponse<StudentMe> me() {
    return ApiResponse.ok(auth.currentStudent());
  }

  @PutMapping("/api/student/me")
  public ApiResponse<StudentMe> profile(@Valid @RequestBody StudentProfile req) {
    return ApiResponse.ok("Profile saved", auth.updateProfile(req));
  }

  @PostMapping("/api/student/me/password")
  public ApiResponse<Void> password(@Valid @RequestBody ChangePassword req) {
    auth.changeStudentPassword(req);
    return ApiResponse.message("Password changed");
  }
}
