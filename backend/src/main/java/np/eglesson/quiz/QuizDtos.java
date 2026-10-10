package np.eglesson.quiz;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import np.eglesson.content.PostDtos.NodeRef;

public final class QuizDtos {
  private QuizDtos() {}

  public record QuizCard(Long id, String title, String slug, String description, NodeRef node, int questionCount,
                         int timeLimitMinutes, long attemptCount, String status, Instant updatedAt) {}

  /** Question as the student sees it before submitting: no answers. */
  public record PlayOption(Long id, String text) {}

  public record PlayQuestion(Long id, String text, List<PlayOption> options) {}

  public record PlayQuiz(QuizCard quiz, List<PlayQuestion> questions, List<AttemptView> myAttempts) {}

  /** questionId → chosen optionId. */
  public record Submission(@NotNull Map<Long, Long> answers, int durationSeconds) {}

  public record QuestionResult(Long questionId, Long chosenOptionId, Long correctOptionId, boolean correct, String explanation) {}

  public record Result(int score, int total, int percent, boolean saved, List<QuestionResult> questions) {}

  public record AttemptView(Long id, Long quizId, String quizTitle, String quizSlug, int score, int total,
                            int durationSeconds, Instant createdAt) {}

  // admin
  public record OptionForm(@NotBlank @Size(max = 1000) String text, boolean correct) {}

  public record QuestionForm(@NotBlank String text, String explanation, @NotNull @Size(min = 2, max = 8) List<@Valid OptionForm> options) {}

  public record QuizForm(@NotBlank @Size(max = 255) String title, @Size(max = 1000) String description,
                         @NotNull Long nodeId, Integer timeLimitMinutes, @NotBlank String status,
                         @NotNull List<@Valid QuestionForm> questions) {}

  public record QuizEdit(Long id, String title, String slug, String description, Long nodeId, String nodePath,
                         int timeLimitMinutes, String status, List<QuestionForm> questions) {}
}
