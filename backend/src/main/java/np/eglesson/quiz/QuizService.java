package np.eglesson.quiz;

import java.util.*;
import java.util.stream.Collectors;
import np.eglesson.audit.AuditService;
import np.eglesson.catalog.CatalogDtos.NodeView;
import np.eglesson.catalog.CatalogNodeRepository;
import np.eglesson.catalog.CatalogService;
import np.eglesson.common.ApiException;
import np.eglesson.common.PageResponse;
import np.eglesson.common.Slugs;
import np.eglesson.config.Current;
import np.eglesson.content.PostDtos.NodeRef;
import np.eglesson.engage.EngageService;
import np.eglesson.quiz.QuizDtos.*;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class QuizService {
  private final QuizRepository quizzes;
  private final QuizAttemptRepository attempts;
  private final CatalogService catalog;
  private final CatalogNodeRepository nodes;
  private final EngageService engage;
  private final AuditService audit;

  public QuizService(QuizRepository quizzes, QuizAttemptRepository attempts, CatalogService catalog,
                     CatalogNodeRepository nodes, EngageService engage, AuditService audit) {
    this.quizzes = quizzes;
    this.attempts = attempts;
    this.catalog = catalog;
    this.nodes = nodes;
    this.engage = engage;
    this.audit = audit;
  }

  QuizCard card(Quiz q) {
    NodeView n = catalog.find(q.getNode().getId()).orElse(null);
    NodeRef ref = n == null ? null : new NodeRef(n.id(), n.name(), n.slug(), n.icon(), n.color(), catalog.pathLabel(n.id()));
    return new QuizCard(q.getId(), q.getTitle(), q.getSlug(), q.getDescription(), ref, q.getQuestions().size(),
        q.getTimeLimitMinutes(), q.getAttemptCount(), q.getStatus(), q.getUpdatedAt());
  }

  @Transactional(readOnly = true)
  public PageResponse<QuizCard> list(String nodeSlug, String q, boolean publishedOnly, Long nodeId, int page, int size) {
    String path = null;
    if (nodeSlug != null && !nodeSlug.isBlank()) path = catalog.getBySlug(nodeSlug).path() + "%";
    else if (nodeId != null) path = catalog.get(nodeId).path() + "%";
    String like = q == null || q.isBlank() ? null : "%" + q.toLowerCase(Locale.ROOT).trim() + "%";
    return PageResponse.of(quizzes.search(publishedOnly ? "PUBLISHED" : null, path, like,
        PageRequest.of(Math.max(0, page), Math.min(Math.max(1, size), 60))), this::card);
  }

  @Transactional(readOnly = true)
  public PlayQuiz play(String slug) {
    Quiz q = quizzes.findBySlug(slug).filter(x -> "PUBLISHED".equals(x.getStatus())).orElseThrow(() -> ApiException.notFound("Quiz"));
    List<PlayQuestion> qs = q.getQuestions().stream().map(qq -> new PlayQuestion(qq.getId(), qq.getText(),
        qq.getOptions().stream().map(o -> new PlayOption(o.getId(), o.getText())).toList())).toList();
    Long sid = Current.studentIdOrNull();
    List<AttemptView> mine = sid == null ? List.of() : attempts.findByStudentIdAndQuizIdOrderByCreatedAtDesc(sid, q.getId(), PageRequest.of(0, 5))
        .stream().map(a -> attemptView(a, q)).toList();
    return new PlayQuiz(card(q), qs, mine);
  }

  /** Guests get their score too; it is only saved for signed-in students. */
  @Transactional
  public Result submit(String slug, Submission s) {
    Quiz q = quizzes.findBySlug(slug).filter(x -> "PUBLISHED".equals(x.getStatus())).orElseThrow(() -> ApiException.notFound("Quiz"));
    int score = 0;
    List<QuestionResult> results = new ArrayList<>();
    for (QuizQuestion qq : q.getQuestions()) {
      Long chosen = s.answers().get(qq.getId());
      Long correctId = qq.getOptions().stream().filter(QuizOption::isCorrect).map(QuizOption::getId).findFirst().orElse(null);
      boolean ok = chosen != null && chosen.equals(correctId);
      if (ok) score++;
      results.add(new QuestionResult(qq.getId(), chosen, correctId, ok, qq.getExplanation()));
    }
    int total = q.getQuestions().size();
    quizzes.incrementAttempts(q.getId());
    Long sid = Current.studentIdOrNull();
    if (sid != null) {
      QuizAttempt a = new QuizAttempt();
      a.setQuizId(q.getId());
      a.setStudentId(sid);
      a.setScore(score);
      a.setTotal(total);
      a.setDurationSeconds(Math.max(0, s.durationSeconds()));
      attempts.save(a);
      engage.markActive(sid);
    }
    return new Result(score, total, total == 0 ? 0 : Math.round(score * 100f / total), sid != null, results);
  }

  @Transactional(readOnly = true)
  public List<AttemptView> myAttempts() {
    Long sid = Current.student().id();
    List<QuizAttempt> list = attempts.findByStudentIdOrderByCreatedAtDesc(sid, PageRequest.of(0, 50));
    Map<Long, Quiz> byId = quizzes.findAllById(list.stream().map(QuizAttempt::getQuizId).collect(Collectors.toSet()))
        .stream().collect(Collectors.toMap(Quiz::getId, x -> x));
    return list.stream().filter(a -> byId.containsKey(a.getQuizId())).map(a -> attemptView(a, byId.get(a.getQuizId()))).toList();
  }

  private AttemptView attemptView(QuizAttempt a, Quiz q) {
    return new AttemptView(a.getId(), q.getId(), q.getTitle(), q.getSlug(), a.getScore(), a.getTotal(), a.getDurationSeconds(), a.getCreatedAt());
  }

  // ------------------------------------------------------------------ admin

  @Transactional(readOnly = true)
  public QuizEdit get(Long id) {
    Quiz q = quizzes.findById(id).orElseThrow(() -> ApiException.notFound("Quiz"));
    return new QuizEdit(q.getId(), q.getTitle(), q.getSlug(), q.getDescription(), q.getNode().getId(),
        catalog.pathLabel(q.getNode().getId()), q.getTimeLimitMinutes(), q.getStatus(),
        q.getQuestions().stream().map(qq -> new QuestionForm(qq.getText(), qq.getExplanation(),
            qq.getOptions().stream().map(o -> new OptionForm(o.getText(), o.isCorrect())).toList())).toList());
  }

  @Transactional
  public QuizEdit save(Long id, QuizForm f) {
    if (!Set.of("DRAFT", "PUBLISHED").contains(f.status())) throw ApiException.badRequest("Status must be DRAFT or PUBLISHED");
    for (int i = 0; i < f.questions().size(); i++) {
      long correct = f.questions().get(i).options().stream().filter(OptionForm::correct).count();
      if (correct != 1) throw ApiException.badRequest("Question " + (i + 1) + " must have exactly one correct answer.");
    }
    if ("PUBLISHED".equals(f.status()) && f.questions().isEmpty()) throw ApiException.badRequest("Add at least one question before publishing.");
    Quiz q = id == null ? new Quiz() : quizzes.findById(id).orElseThrow(() -> ApiException.notFound("Quiz"));
    if (id == null) {
      q.setCreatedBy(Current.admin().id());
      q.setSlug(Slugs.unique(Slugs.slugify(f.title()), quizzes::existsBySlug));
    }
    q.setTitle(f.title().trim());
    q.setDescription(f.description());
    q.setNode(nodes.findById(f.nodeId()).orElseThrow(() -> ApiException.badRequest("Choose a subject")));
    q.setTimeLimitMinutes(f.timeLimitMinutes() == null ? 0 : Math.max(0, f.timeLimitMinutes()));
    q.setStatus(f.status());
    // Questions are replaced as a whole; past attempts keep their score.
    q.getQuestions().clear();
    quizzes.saveAndFlush(q);
    int qi = 0;
    for (QuestionForm qf : f.questions()) {
      QuizQuestion qq = new QuizQuestion();
      qq.setQuiz(q);
      qq.setText(qf.text().trim());
      qq.setExplanation(qf.explanation());
      qq.setSortOrder(qi++);
      int oi = 0;
      for (OptionForm of : qf.options()) {
        QuizOption o = new QuizOption();
        o.setQuestion(qq);
        o.setText(of.text().trim());
        o.setCorrect(of.correct());
        o.setSortOrder(oi++);
        qq.getOptions().add(o);
      }
      q.getQuestions().add(qq);
    }
    quizzes.save(q);
    audit.log(id == null ? "CREATE" : "UPDATE", "QUIZ", q.getId(), q.getTitle());
    return get(q.getId());
  }

  @Transactional
  public void delete(Long id) {
    Quiz q = quizzes.findById(id).orElseThrow(() -> ApiException.notFound("Quiz"));
    quizzes.delete(q);
    audit.log("DELETE", "QUIZ", id, q.getTitle());
  }
}
