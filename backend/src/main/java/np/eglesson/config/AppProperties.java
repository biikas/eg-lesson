package np.eglesson.config;

import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app")
public record AppProperties(String zone, Jwt jwt, Cors cors, Upload upload, Seed seed, Admin admin) {
  public record Jwt(String secret, int adminHours, int studentDays) {}
  public record Cors(List<String> allowedOrigins) {}
  public record Upload(String dir, List<String> allowedTypes) {}
  public record Seed(boolean catalog, boolean demoContent) {}
  public record Admin(String bootstrapUsername, String bootstrapPassword) {}
}
