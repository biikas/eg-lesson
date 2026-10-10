package np.eglesson.content;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.List;
import np.eglesson.catalog.CatalogDtos.Crumb;

public final class PostDtos {
  private PostDtos() {}

  public record TypeRef(Long id, String code, String name, String icon, String color) {}

  public record NodeRef(Long id, String name, String slug, String icon, String color, String pathLabel) {}

  public record PostCard(Long id, String title, String slug, String excerpt, String coverImage, TypeRef contentType,
                         NodeRef node, String language, String difficulty, int readMinutes, Instant publishedAt,
                         long viewCount, int likeCount, int commentCount, boolean featured, boolean hasVideo,
                         String status, String authorName, Instant updatedAt) {}

  public record Attachment(String title, String url) {}

  public record PostDetail(PostCard card, String body, List<String> tags, List<Attachment> attachments, String videoUrl,
                           List<Crumb> breadcrumb, boolean allowComments, String metaTitle, String metaDescription,
                           int bookmarkCount, boolean liked, boolean bookmarked, PostCard previous, PostCard next,
                           List<PostCard> related) {}

  /** What the admin editor sends. */
  public record PostForm(@NotBlank @Size(max = 255) String title, @Size(max = 190) String slug,
                         @Size(max = 600) String excerpt, String body, String coverImage, @NotNull Long nodeId,
                         @NotNull Long contentTypeId, String language, String difficulty, String videoUrl,
                         @NotNull PostStatus status, Boolean featured, Boolean allowComments, Instant publishedAt,
                         @Size(max = 255) String metaTitle, @Size(max = 500) String metaDescription,
                         List<String> tags, List<Attachment> attachments) {}

  /** Full post as the admin editor loads it. */
  public record PostEdit(Long id, String title, String slug, String excerpt, String body, String coverImage, Long nodeId,
                         String nodePath, Long contentTypeId, String language, String difficulty, String videoUrl,
                         PostStatus status, boolean featured, boolean allowComments, Instant publishedAt,
                         String metaTitle, String metaDescription, List<String> tags, List<Attachment> attachments,
                         String authorName, long viewCount, int likeCount, int commentCount, int bookmarkCount,
                         Instant createdAt, Instant updatedAt) {}

  public record Suggestion(String kind, String title, String subtitle, String slug, String icon, String color) {}

  public record SearchResult(List<Suggestion> categories, np.eglesson.common.PageResponse<PostCard> posts) {}
}
