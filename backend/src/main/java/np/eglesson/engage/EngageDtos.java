package np.eglesson.engage;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.List;
import np.eglesson.content.PostDtos.PostCard;

public final class EngageDtos {
  private EngageDtos() {}

  public record CommentView(Long id, Long parentId, String authorName, String authorColor, boolean team, boolean mine,
                            String body, String status, Instant createdAt, List<CommentView> replies) {}

  public record CommentForm(@NotBlank @Size(max = 2000) String body, Long parentId) {}

  /** Admin moderation row. */
  public record CommentRow(Long id, Long postId, String postTitle, String postSlug, Long parentId, String authorName,
                           boolean team, String body, String status, Instant createdAt) {}

  public record Toggle(boolean active, long count) {}

  public record HistoryItem(PostCard post, int progress, Instant lastReadAt) {}

  public record LearningStats(int streak, int bestStreak, long notesOpened, long notesCompleted, long bookmarks,
                              long quizzesTaken, Integer quizAverage, List<String> activeDays) {}
}
