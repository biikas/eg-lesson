package np.eglesson.audit;

import np.eglesson.config.AuthPrincipal;
import np.eglesson.config.Current;
import org.springframework.stereotype.Service;

/** Records who changed what in the admin portal, so the owner can follow the content team's daily work. */
@Service
public class AuditService {
  private final AuditLogRepository repo;

  public AuditService(AuditLogRepository repo) {
    this.repo = repo;
  }

  public void log(String action, String entity, Long entityId, String summary) {
    AuthPrincipal p = Current.principalOrNull();
    AuditLog a = new AuditLog();
    if (p != null && p.isAdmin()) {
      a.setAdminId(p.id());
      a.setAdminName(p.name());
    } else {
      a.setAdminName("system");
    }
    a.setAction(action);
    a.setEntity(entity);
    a.setEntityId(entityId);
    a.setSummary(summary == null ? null : summary.length() > 480 ? summary.substring(0, 480) : summary);
    repo.save(a);
  }
}
