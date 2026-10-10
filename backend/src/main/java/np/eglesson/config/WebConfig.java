package np.eglesson.config;

import java.io.IOException;
import java.nio.file.Path;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.resource.PathResourceResolver;

@Configuration
public class WebConfig implements WebMvcConfigurer {
  private final AppProperties props;

  public WebConfig(AppProperties props) {
    this.props = props;
  }

  @Override
  public void addResourceHandlers(ResourceHandlerRegistry registry) {
    String dir = Path.of(props.upload().dir()).toAbsolutePath().normalize().toUri().toString();
    registry.addResourceHandler("/uploads/**").addResourceLocations(dir).setCachePeriod(60 * 60 * 24 * 30);

    // The Angular build is packaged under static/. Unknown paths (client-side routes such as /read/xyz or
    // /admin/posts) fall back to index.html so a page refresh works.
    registry.addResourceHandler("/**")
        .addResourceLocations("classpath:/static/")
        .resourceChain(true)
        .addResolver(new PathResourceResolver() {
          @Override
          protected Resource getResource(String resourcePath, Resource location) throws IOException {
            Resource requested = location.createRelative(resourcePath);
            if (requested.exists() && requested.isReadable()) return requested;
            if (resourcePath.startsWith("api/") || resourcePath.startsWith("uploads/")) return null;
            Resource index = new ClassPathResource("/static/index.html");
            return index.exists() ? index : null;
          }
        });
  }
}
