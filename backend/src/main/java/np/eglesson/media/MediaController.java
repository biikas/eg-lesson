package np.eglesson.media;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.*;
import java.time.LocalDate;
import java.util.Locale;
import java.util.UUID;
import np.eglesson.audit.AuditService;
import np.eglesson.common.ApiException;
import np.eglesson.common.ApiResponse;
import np.eglesson.common.PageResponse;
import np.eglesson.config.AppProperties;
import np.eglesson.config.Current;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

/** Images and PDFs for posts, notices and banners. Files are stored on disk and served from /uploads/. */
@RestController
@RequestMapping("/api/admin/media")
public class MediaController {
  private final MediaRepository repo;
  private final AppProperties props;
  private final AuditService audit;

  public MediaController(MediaRepository repo, AppProperties props, AuditService audit) {
    this.repo = repo;
    this.props = props;
    this.audit = audit;
  }

  @PostMapping
  public ApiResponse<Media> upload(@RequestParam("file") MultipartFile file) throws IOException {
    if (file.isEmpty()) throw ApiException.badRequest("Empty file");
    String type = file.getContentType() == null ? "" : file.getContentType().toLowerCase(Locale.ROOT);
    if (!props.upload().allowedTypes().contains(type)) throw ApiException.badRequest("Only images (JPG, PNG, WebP, GIF) and PDF files are allowed.");
    String original = file.getOriginalFilename() == null ? "file" : Paths.get(file.getOriginalFilename()).getFileName().toString();
    String ext = switch (type) {
      case "image/jpeg" -> ".jpg";
      case "image/png" -> ".png";
      case "image/webp" -> ".webp";
      case "image/gif" -> ".gif";
      case "application/pdf" -> ".pdf";
      default -> "";
    };
    LocalDate today = LocalDate.now();
    String folder = today.getYear() + "/" + String.format("%02d", today.getMonthValue());
    String stored = UUID.randomUUID().toString().replace("-", "") + ext;
    Path dir = Paths.get(props.upload().dir()).toAbsolutePath().normalize().resolve(folder);
    Files.createDirectories(dir);
    try (InputStream in = file.getInputStream()) {
      Files.copy(in, dir.resolve(stored), StandardCopyOption.REPLACE_EXISTING);
    }
    Media m = new Media();
    m.setOriginalName(original.length() > 250 ? original.substring(0, 250) : original);
    m.setStoredName(folder + "/" + stored);
    m.setUrl("/uploads/" + folder + "/" + stored);
    m.setContentType(type);
    m.setSizeBytes(file.getSize());
    m.setUploadedBy(Current.admin().id());
    repo.save(m);
    audit.log("UPLOAD", "MEDIA", m.getId(), m.getOriginalName());
    return ApiResponse.ok(m);
  }

  @GetMapping
  public ApiResponse<PageResponse<Media>> list(@RequestParam(required = false) String type,
                                               @RequestParam(required = false) String q,
                                               @RequestParam(defaultValue = "0") int page,
                                               @RequestParam(defaultValue = "30") int size) {
    String t = type == null || type.isBlank() ? null : type + "%";
    String like = q == null || q.isBlank() ? null : "%" + q.toLowerCase(Locale.ROOT) + "%";
    return ApiResponse.ok(PageResponse.of(repo.search(t, like, PageRequest.of(Math.max(0, page), Math.min(size, 100))), m -> m));
  }

  @DeleteMapping("/{id}")
  @PreAuthorize("hasAuthority('PERM_CONTENT_PUBLISH')")
  public ApiResponse<Void> delete(@PathVariable Long id) throws IOException {
    Media m = repo.findById(id).orElseThrow(() -> ApiException.notFound("File"));
    Path base = Paths.get(props.upload().dir()).toAbsolutePath().normalize();
    Path file = base.resolve(m.getStoredName()).normalize();
    if (file.startsWith(base)) Files.deleteIfExists(file);
    repo.delete(m);
    audit.log("DELETE", "MEDIA", id, m.getOriginalName());
    return ApiResponse.message("File deleted");
  }
}
