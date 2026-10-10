package np.eglesson.config;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import javax.crypto.SecretKey;
import org.springframework.stereotype.Service;

@Service
public class JwtService {
  private final SecretKey key;
  private final AppProperties props;

  public JwtService(AppProperties props) {
    this.props = props;
    byte[] bytes = props.jwt().secret().getBytes(StandardCharsets.UTF_8);
    if (bytes.length < 32) throw new IllegalStateException("app.jwt.secret (JWT_SECRET) must be at least 32 characters");
    this.key = Keys.hmacShaKeyFor(bytes);
  }

  public String issue(AuthPrincipal p) {
    Duration ttl = p.isAdmin() ? Duration.ofHours(props.jwt().adminHours()) : Duration.ofDays(props.jwt().studentDays());
    Instant now = Instant.now();
    return Jwts.builder()
        .subject(Long.toString(p.id()))
        .claim("typ", p.type())
        .claim("name", p.name())
        .issuedAt(Date.from(now))
        .expiration(Date.from(now.plus(ttl)))
        .signWith(key)
        .compact();
  }

  /** Returns null when the token is missing, expired or forged. */
  public AuthPrincipal parse(String token) {
    try {
      Claims c = Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
      return new AuthPrincipal(Long.parseLong(c.getSubject()), c.get("typ", String.class), c.get("name", String.class));
    } catch (RuntimeException e) {
      return null;
    }
  }
}
