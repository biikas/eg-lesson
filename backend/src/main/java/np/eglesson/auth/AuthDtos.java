package np.eglesson.auth;

import jakarta.validation.constraints.*;
import java.time.Instant;
import java.util.List;
import java.util.Set;

public final class AuthDtos {
  private AuthDtos() {}

  public record AdminLogin(@NotBlank String username, @NotBlank String password) {}

  public record AdminMe(Long id, String username, String fullName, String email, String role,
                        Set<Permission> permissions, boolean mustChangePassword) {}

  public record AdminSession(String token, AdminMe admin) {}

  public record ChangePassword(@NotBlank String currentPassword, @NotBlank @Size(min = 8, max = 72) String newPassword) {}

  /** Students sign up with an email or a mobile number (one is enough). */
  public record StudentRegister(@NotBlank @Size(max = 120) String fullName, @Email @Size(max = 160) String email,
                                @Pattern(regexp = "^(98|97|96)\\d{8}$", message = "must be a 10-digit Nepali mobile number") String phone,
                                @NotBlank @Size(min = 6, max = 72) String password, Long courseNodeId) {}

  public record StudentLogin(@NotBlank String login, @NotBlank String password) {}

  public record StudentMe(Long id, String fullName, String email, String phone, Long courseNodeId, String courseSlug,
                          String courseName, String school, String district, String avatarColor, Instant createdAt) {}

  public record StudentSession(String token, StudentMe student) {}

  public record StudentProfile(@NotBlank @Size(max = 120) String fullName, Long courseNodeId, @Size(max = 160) String school,
                               @Size(max = 60) String district) {}

  // admin management
  public record AdminUserForm(@NotBlank @Size(max = 60) String username, @NotBlank @Size(max = 120) String fullName,
                              @Email String email, @NotNull Long roleId, Boolean active,
                              @Size(min = 8, max = 72) String password) {}

  public record AdminUserView(Long id, String username, String fullName, String email, Long roleId, String roleName,
                              boolean active, boolean mustChangePassword, Instant lastLoginAt, Instant createdAt) {}

  public record RoleForm(@NotBlank @Size(max = 60) String name, @Size(max = 255) String description,
                         @NotNull Set<Permission> permissions) {}

  public record RoleView(Long id, String name, String description, boolean systemRole, Set<Permission> permissions, long userCount) {}

  public record PermissionView(String name, String description) {}

  public record StudentRow(Long id, String fullName, String email, String phone, String courseName, String school,
                           String district, boolean active, Instant lastLoginAt, Instant createdAt) {}

  public record Lists(List<RoleView> roles, List<PermissionView> permissions) {}
}
