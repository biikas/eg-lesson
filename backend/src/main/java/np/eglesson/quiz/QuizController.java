package np.eglesson.quiz;

import jakarta.validation.Valid;
import java.util.List;
import np.eglesson.common.ApiResponse;
import np.eglesson.common.PageResponse;
import np.eglesson.quiz.QuizDtos.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
public class QuizController {
  private final QuizService quizzes;

  public QuizController(QuizService quizzes) {
    this.quizzes = quizzes;
  }

  @GetMapping("/api/public/quizzes")
  public ApiResponse<PageResponse<QuizCard>> list(@RequestParam(required = false) String node,
                                                  @RequestParam(required = false) String q,
                                                  @RequestParam(defaultValue = "0") int page,
                                                  @RequestParam(defaultValue = "12") int size) {
    return ApiResponse.ok(quizzes.list(node, q, true, null, page, size));
  }

  @GetMapping("/api/public/quizzes/{slug}")
  public ApiResponse<PlayQuiz> play(@PathVariable String slug) {
    return ApiResponse.ok(quizzes.play(slug));
  }

  @PostMapping("/api/public/quizzes/{slug}/submit")
  public ApiResponse<Result> submit(@PathVariable String slug, @Valid @RequestBody Submission s) {
    return ApiResponse.ok(quizzes.submit(slug, s));
  }

  @GetMapping("/api/student/quiz-attempts")
  public ApiResponse<List<AttemptView>> mine() {
    return ApiResponse.ok(quizzes.myAttempts());
  }

  @GetMapping("/api/admin/quizzes")
  @PreAuthorize("hasAuthority('PERM_QUIZZES')")
  public ApiResponse<PageResponse<QuizCard>> adminList(@RequestParam(required = false) Long nodeId,
                                                       @RequestParam(required = false) String q,
                                                       @RequestParam(defaultValue = "0") int page,
                                                       @RequestParam(defaultValue = "20") int size) {
    return ApiResponse.ok(quizzes.list(null, q, false, nodeId, page, size));
  }

  @GetMapping("/api/admin/quizzes/{id}")
  @PreAuthorize("hasAuthority('PERM_QUIZZES')")
  public ApiResponse<QuizEdit> get(@PathVariable Long id) {
    return ApiResponse.ok(quizzes.get(id));
  }

  @PostMapping("/api/admin/quizzes")
  @PreAuthorize("hasAuthority('PERM_QUIZZES')")
  public ApiResponse<QuizEdit> create(@Valid @RequestBody QuizForm f) {
    return ApiResponse.ok("Quiz created", quizzes.save(null, f));
  }

  @PutMapping("/api/admin/quizzes/{id}")
  @PreAuthorize("hasAuthority('PERM_QUIZZES')")
  public ApiResponse<QuizEdit> update(@PathVariable Long id, @Valid @RequestBody QuizForm f) {
    return ApiResponse.ok("Quiz saved", quizzes.save(id, f));
  }

  @DeleteMapping("/api/admin/quizzes/{id}")
  @PreAuthorize("hasAuthority('PERM_QUIZZES')")
  public ApiResponse<Void> delete(@PathVariable Long id) {
    quizzes.delete(id);
    return ApiResponse.message("Quiz deleted");
  }
}
