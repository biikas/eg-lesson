package np.eglesson.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;
import np.eglesson.audit.AuditService;
import np.eglesson.catalog.CatalogService;
import np.eglesson.common.ApiException;
import np.eglesson.common.PageResponse;
import np.eglesson.config.Current;
import np.eglesson.content.Post;
import np.eglesson.content.PostRepository;
import np.eglesson.student.Student;
import np.eglesson.student.StudentRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ContentRequestService {
  public static final Set<String> STATUSES = Set.of("OPEN", "IN_PROGRESS", "DONE", "REJECTED");

  public record RequestForm(Long nodeId, @NotBlank @Size(max = 255) String topic, @Size(max = 2000) String details) {}

  public record ResolveForm(@NotBlank String status, String adminNote, Long postId) {}

  public record RequestView(Long id, Long nodeId, String nodePath, String topic, String details, String status,
                            String adminNote, String postSlug, String postTitle, String studentName,
                            Instant createdAt, Instant updatedAt) {}

  private final ContentRequestRepository repo;
  private final StudentRepository students;
  private final PostRepository posts;
  private final CatalogService catalog;
  private final AuditService audit;

  public ContentRequestService(ContentRequestRepository repo, StudentRepository students, PostRepository posts,
                               CatalogService catalog, AuditService audit) {
    this.repo = repo;
    this.students = students;
    this.posts = posts;
    this.catalog = catalog;
    this.audit = audit;
  }

  private RequestView view(ContentRequest r, Map<Long, Student> studentMap, Map<Long, Post> postMap) {
    Post p = r.getPostId() == null ? null : postMap.get(r.getPostId());
    Student s = studentMap.get(r.getStudentId());
    return new RequestView(r.getId(), r.getNodeId(), r.getNodeId() == null ? null : catalog.find(r.getNodeId()).map(n -> catalog.pathLabel(n.id())).orElse(null),
        r.getTopic(), r.getDetails(), r.getStatus(), r.getAdminNote(), p == null ? null : p.getSlug(),
        p == null ? null : p.getTitle(), s == null ? null : s.getFullName(), r.getCreatedAt(), r.getUpdatedAt());
  }

  private List<RequestView> views(List<ContentRequest> list) {
    Map<Long, Student> sm = students.findAllById(list.stream().map(ContentRequest::getStudentId).collect(Collectors.toSet()))
        .stream().collect(Collectors.toMap(Student::getId, s -> s));
    Map<Long, Post> pm = posts.findAllById(list.stream().map(ContentRequest::getPostId).filter(Objects::nonNull).collect(Collectors.toSet()))
        .stream().collect(Collectors.toMap(Post::getId, p -> p));
    return list.stream().map(r -> view(r, sm, pm)).toList();
  }

  @Transactional
  public RequestView create(RequestForm f) {
    Long sid = Current.student().id();
    if (repo.countByStudentIdAndStatus(sid, "OPEN") >= 10) {
      throw ApiException.badRequest("You already have 10 open requests. We'll get to them soon!");
    }
    if (f.nodeId() != null) catalog.get(f.nodeId());
    ContentRequest r = new ContentRequest();
    r.setStudentId(sid);
    r.setNodeId(f.nodeId());
    r.setTopic(f.topic().trim());
    r.setDetails(f.details() == null ? null : f.details().trim());
    repo.save(r);
    return views(List.of(r)).get(0);
  }

  @Transactional(readOnly = true)
  public List<RequestView> mine() {
    return views(repo.findByStudentIdOrderByCreatedAtDesc(Current.student().id()));
  }

  @Transactional(readOnly = true)
  public PageResponse<RequestView> adminList(String status, int page, int size) {
    Page<ContentRequest> pg = repo.search(status == null || status.isBlank() ? null : status, PageRequest.of(Math.max(0, page), Math.min(size, 100)));
    List<RequestView> items = views(pg.getContent());
    return new PageResponse<>(items, pg.getNumber(), pg.getSize(), pg.getTotalElements(), pg.getTotalPages());
  }

  @Transactional
  public RequestView resolve(Long id, ResolveForm f) {
    if (!STATUSES.contains(f.status())) throw ApiException.badRequest("Unknown status");
    ContentRequest r = repo.findById(id).orElseThrow(() -> ApiException.notFound("Request"));
    if (f.postId() != null && !posts.existsById(f.postId())) throw ApiException.badRequest("Post not found");
    r.setStatus(f.status());
    r.setAdminNote(f.adminNote());
    r.setPostId(f.postId());
    audit.log(f.status(), "REQUEST", id, r.getTopic());
    return views(List.of(r)).get(0);
  }
}
