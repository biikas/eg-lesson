package np.eglesson.common;

/** Envelope for every API response: the Angular client reads {@code success}, {@code message} and {@code data}. */
public record ApiResponse<T>(boolean success, String message, T data) {
  public static <T> ApiResponse<T> ok(T data) {
    return new ApiResponse<>(true, null, data);
  }

  public static <T> ApiResponse<T> ok(String message, T data) {
    return new ApiResponse<>(true, message, data);
  }

  public static ApiResponse<Void> message(String message) {
    return new ApiResponse<>(true, message, null);
  }

  public static ApiResponse<Void> error(String message) {
    return new ApiResponse<>(false, message, null);
  }
}
