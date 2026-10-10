package np.eglesson;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication(exclude = UserDetailsServiceAutoConfiguration.class)
@ConfigurationPropertiesScan
@EnableScheduling
public class EglessonApplication {
  public static void main(String[] args) {
    SpringApplication app = new SpringApplication(EglessonApplication.class);
    // Developer launcher: local MySQL unless SPRING_PROFILES_ACTIVE says otherwise.
    app.setAdditionalProfiles(System.getenv("SPRING_PROFILES_ACTIVE") == null ? new String[] {"dev"} : new String[0]);
    app.run(args);
  }
}
