package np.eglesson.auth;

/** What an admin role may do. Granted as authorities named {@code PERM_<name>}. */
public enum Permission {
  DASHBOARD("View statistics dashboard"),
  CONTENT_WRITE("Write and edit notes/posts (drafts)"),
  CONTENT_PUBLISH("Publish, schedule and delete any post"),
  CATALOG("Manage streams, classes, semesters, subjects and content types"),
  COMMENTS("Moderate comments"),
  NOTICES("Manage notices"),
  PROMOS("Manage banners and advertisements"),
  QUIZZES("Manage practice quizzes"),
  REQUESTS("Handle note requests from students"),
  STUDENTS("View and block students"),
  ADMINS("Manage admin users and roles"),
  SETTINGS("Change site settings"),
  AUDIT("View the audit log");

  private final String description;

  Permission(String description) {
    this.description = description;
  }

  public String getDescription() {
    return description;
  }
}
