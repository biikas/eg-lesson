package np.eglesson.config;

/** The signed-in caller: an admin (portal) or a student (learner site). */
public record AuthPrincipal(long id, String type, String name) {
  public static final String ADMIN = "ADMIN";
  public static final String STUDENT = "STUDENT";

  public boolean isAdmin() {
    return ADMIN.equals(type);
  }

  public boolean isStudent() {
    return STUDENT.equals(type);
  }
}
