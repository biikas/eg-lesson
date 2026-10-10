package np.eglesson;

import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.boot.web.servlet.support.SpringBootServletInitializer;

/** Entry point when deployed as a WAR in Tomcat: defaults to the "prod" profile. */
public class ServletInitializer extends SpringBootServletInitializer {
  @Override
  protected SpringApplicationBuilder configure(SpringApplicationBuilder builder) {
    if (System.getenv("SPRING_PROFILES_ACTIVE") == null && System.getProperty("spring.profiles.active") == null) {
      builder.profiles("prod");
    }
    return builder.sources(EglessonApplication.class);
  }
}
