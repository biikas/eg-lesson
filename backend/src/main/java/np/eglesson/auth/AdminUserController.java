package np.eglesson.auth;

import jakarta.validation.Valid;
import java.util.Arrays;
import java.util.EnumSet;
import java.util.List;
import java.util.Locale;
import np.eglesson.audit.AuditService;
import np.eglesson.auth.AuthDtos.*;
import np.eglesson.common.ApiException;
import np.eglesson.common.ApiResponse;
import np.eglesson.config.Current;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

/** Admin users and roles (profiles), in the style of the mbank admin "profile" + "user" screens. */
@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasAuthority('PERM_ADMINS')")
public class AdminUserController {
  private final AdminUserRepository users;
  private final RoleRepository roles;
  private final PasswordEncoder encoder;
  private final AuditService audit;

  public AdminUserController(AdminUserRepository users, RoleRepository roles, PasswordEncoder encoder, AuditService audit) {
    this.users = users;
    this.roles = roles;
    this.encoder = encoder;
    this.audit = audit;
  }

  private static AdminUserView view(AdminUser a) {
    return new AdminUserView(a.getId(), a.getUsername(), a.getFullName(), a.getEmail(), a.getRole().getId(),
        a.getRole().getName(), a.isActive(), a.isMustChangePassword(), a.getLastLoginAt(), a.getCreatedAt());
  }

  private RoleView view(Role r) {
    return new RoleView(r.getId(), r.getName(), r.getDescription(), r.isSystemRole(), r.getPermissions(), users.countByRoleId(r.getId()));
  }

  @GetMapping("/users")
  @Transactional(readOnly = true)
  public ApiResponse<List<AdminUserView>> list() {
    return ApiResponse.ok(users.findAll(Sort.by("fullName")).stream().map(AdminUserController::view).toList());
  }

  @PostMapping("/users")
  @Transactional
  public ApiResponse<AdminUserView> create(@Valid @RequestBody AdminUserForm f) {
    if (f.password() == null) throw ApiException.badRequest("Set a temporary password (min 8 characters).");
    String username = f.username().trim().toLowerCase(Locale.ROOT);
    if (users.existsByUsernameIgnoreCase(username)) throw ApiException.conflict("Username already taken");
    AdminUser a = new AdminUser();
    a.setUsername(username);
    a.setPasswordHash(encoder.encode(f.password()));
    a.setMustChangePassword(true);
    apply(a, f);
    users.save(a);
    audit.log("CREATE", "ADMIN_USER", a.getId(), a.getUsername() + " (" + a.getRole().getName() + ")");
    return ApiResponse.ok("Admin created. They must change the password at first sign-in.", view(a));
  }

  @PutMapping("/users/{id}")
  @Transactional
  public ApiResponse<AdminUserView> update(@PathVariable Long id, @Valid @RequestBody AdminUserForm f) {
    AdminUser a = users.findById(id).orElseThrow(() -> ApiException.notFound("Admin"));
    if (a.getId().equals(Current.admin().id()) && (Boolean.FALSE.equals(f.active()) || !a.getRole().getId().equals(f.roleId()))) {
      throw ApiException.badRequest("You can't disable yourself or change your own role.");
    }
    apply(a, f);
    if (f.password() != null && !f.password().isBlank()) {
      a.setPasswordHash(encoder.encode(f.password()));
      a.setMustChangePassword(true);
    }
    audit.log("UPDATE", "ADMIN_USER", a.getId(), a.getUsername());
    return ApiResponse.ok("Admin saved", view(a));
  }

  private void apply(AdminUser a, AdminUserForm f) {
    a.setFullName(f.fullName().trim());
    a.setEmail(f.email() == null || f.email().isBlank() ? null : f.email().trim());
    a.setRole(roles.findById(f.roleId()).orElseThrow(() -> ApiException.badRequest("Role not found")));
    a.setActive(f.active() == null || f.active());
  }

  @GetMapping("/roles")
  @Transactional(readOnly = true)
  public ApiResponse<Lists> roles() {
    return ApiResponse.ok(new Lists(roles.findAll(Sort.by("name")).stream().map(this::view).toList(),
        Arrays.stream(Permission.values()).map(p -> new PermissionView(p.name(), p.getDescription())).toList()));
  }

  @PostMapping("/roles")
  @Transactional
  public ApiResponse<RoleView> createRole(@Valid @RequestBody RoleForm f) {
    if (roles.existsByNameIgnoreCase(f.name().trim())) throw ApiException.conflict("Role name already used");
    Role r = new Role();
    r.setName(f.name().trim());
    r.setDescription(f.description());
    r.setPermissions(f.permissions().isEmpty() ? EnumSet.noneOf(Permission.class) : EnumSet.copyOf(f.permissions()));
    roles.save(r);
    audit.log("CREATE", "ROLE", r.getId(), r.getName());
    return ApiResponse.ok("Role created", view(r));
  }

  @PutMapping("/roles/{id}")
  @Transactional
  public ApiResponse<RoleView> updateRole(@PathVariable Long id, @Valid @RequestBody RoleForm f) {
    Role r = roles.findById(id).orElseThrow(() -> ApiException.notFound("Role"));
    if (r.isSystemRole()) throw ApiException.badRequest("The Super Admin role always has every permission.");
    r.setName(f.name().trim());
    r.setDescription(f.description());
    r.getPermissions().clear();
    r.getPermissions().addAll(f.permissions());
    audit.log("UPDATE", "ROLE", r.getId(), r.getName() + ": " + f.permissions());
    return ApiResponse.ok("Role saved", view(r));
  }

  @DeleteMapping("/roles/{id}")
  @Transactional
  public ApiResponse<Void> deleteRole(@PathVariable Long id) {
    Role r = roles.findById(id).orElseThrow(() -> ApiException.notFound("Role"));
    if (r.isSystemRole()) throw ApiException.badRequest("Built-in role can't be deleted.");
    if (users.countByRoleId(id) > 0) throw ApiException.conflict("Move this role's admins to another role first.");
    roles.delete(r);
    audit.log("DELETE", "ROLE", id, r.getName());
    return ApiResponse.message("Role deleted");
  }
}
