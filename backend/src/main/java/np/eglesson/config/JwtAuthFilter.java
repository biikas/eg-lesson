package np.eglesson.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import np.eglesson.auth.AdminUserRepository;
import np.eglesson.student.StudentRepository;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Reads the bearer token. Admin permissions are loaded from the database on every request, so disabling an admin
 * or changing a role takes effect immediately instead of when the token expires.
 */
@Component
public class JwtAuthFilter extends OncePerRequestFilter {
  private final JwtService jwt;
  private final AdminUserRepository admins;
  private final StudentRepository students;

  public JwtAuthFilter(JwtService jwt, AdminUserRepository admins, StudentRepository students) {
    this.jwt = jwt;
    this.admins = admins;
    this.students = students;
  }

  @Override
  protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
      throws ServletException, IOException {
    String header = req.getHeader("Authorization");
    if (header != null && header.startsWith("Bearer ")) {
      AuthPrincipal p = jwt.parse(header.substring(7));
      if (p != null) {
        List<GrantedAuthority> authorities = new ArrayList<>();
        boolean valid = false;
        if (p.isAdmin()) {
          var admin = admins.findById(p.id()).filter(a -> a.isActive()).orElse(null);
          if (admin != null) {
            valid = true;
            // Until the first-login password change, the token only allows reading "me" and changing the password.
            if (admin.isMustChangePassword()) {
              authorities.add(new SimpleGrantedAuthority("ROLE_ADMIN_PENDING"));
            } else {
              authorities.add(new SimpleGrantedAuthority("ROLE_ADMIN"));
              admin.getRole().getPermissions().forEach(perm -> authorities.add(new SimpleGrantedAuthority("PERM_" + perm.name())));
            }
          }
        } else if (p.isStudent()) {
          valid = students.findById(p.id()).map(s -> s.isActive()).orElse(false);
          if (valid) authorities.add(new SimpleGrantedAuthority("ROLE_STUDENT"));
        }
        if (valid) {
          var auth = new UsernamePasswordAuthenticationToken(p, null, authorities);
          SecurityContextHolder.getContext().setAuthentication(auth);
        }
      }
    }
    chain.doFilter(req, res);
  }
}
