package np.eglesson.config;

import np.eglesson.common.ApiException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

/** Access to the signed-in caller from services. */
public final class Current {
  private Current() {}

  public static AuthPrincipal principalOrNull() {
    Authentication a = SecurityContextHolder.getContext().getAuthentication();
    return a != null && a.getPrincipal() instanceof AuthPrincipal p ? p : null;
  }

  public static AuthPrincipal admin() {
    AuthPrincipal p = principalOrNull();
    if (p == null || !p.isAdmin()) throw ApiException.unauthorized("Please sign in.");
    return p;
  }

  public static AuthPrincipal student() {
    AuthPrincipal p = principalOrNull();
    if (p == null || !p.isStudent()) throw ApiException.unauthorized("Please sign in.");
    return p;
  }

  /** The signed-in student's id, or null for guests and admins. */
  public static Long studentIdOrNull() {
    AuthPrincipal p = principalOrNull();
    return p != null && p.isStudent() ? p.id() : null;
  }

  public static boolean has(String permission) {
    Authentication a = SecurityContextHolder.getContext().getAuthentication();
    return a != null && a.getAuthorities().stream().anyMatch(g -> g.getAuthority().equals("PERM_" + permission));
  }
}
