package np.eglesson.catalog;

import java.time.Instant;
import java.util.*;
import np.eglesson.audit.AuditService;
import np.eglesson.catalog.CatalogDtos.*;
import np.eglesson.common.ApiException;
import np.eglesson.common.Slugs;
import np.eglesson.content.PostRepository;
import np.eglesson.quiz.QuizRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

/**
 * The browse tree. Students hit it on every page, so it is served from an in-memory snapshot that is rebuilt after
 * any admin change; post counts are refreshed at most once a minute.
 */
@Service
public class CatalogService {
  private final CatalogNodeRepository nodes;
  private final NodeTypeRepository nodeTypes;
  private final ContentTypeRepository contentTypes;
  private final PostRepository posts;
  private final QuizRepository quizzes;
  private final AuditService audit;

  private volatile Snapshot snapshot;
  private volatile Map<Long, Long> directCounts;
  private volatile long countsLoadedAt;

  public CatalogService(CatalogNodeRepository nodes, NodeTypeRepository nodeTypes, ContentTypeRepository contentTypes,
                        PostRepository posts, QuizRepository quizzes, AuditService audit) {
    this.nodes = nodes;
    this.nodeTypes = nodeTypes;
    this.contentTypes = contentTypes;
    this.posts = posts;
    this.quizzes = quizzes;
    this.audit = audit;
  }

  private record Snapshot(Map<Long, NodeView> byId, Map<String, NodeView> bySlug, Map<Long, List<NodeView>> children,
                          List<NodeView> roots) {}

  // ------------------------------------------------------------------ reads

  private Snapshot snap() {
    Snapshot s = snapshot;
    if (s == null) {
      synchronized (this) {
        if (snapshot == null) snapshot = load();
        s = snapshot;
      }
    }
    return s;
  }

  private Snapshot load() {
    Map<Long, NodeView> byId = new LinkedHashMap<>();
    Map<String, NodeView> bySlug = new HashMap<>();
    Map<Long, List<NodeView>> children = new HashMap<>();
    List<NodeView> roots = new ArrayList<>();
    for (CatalogNode n : nodes.findAllByOrderByDepthAscSortOrderAscNameAsc()) {
      NodeView v = NodeView.of(n);
      byId.put(v.id(), v);
      bySlug.put(v.slug(), v);
      if (v.parentId() == null) roots.add(v);
      else children.computeIfAbsent(v.parentId(), k -> new ArrayList<>()).add(v);
    }
    Comparator<NodeView> order = Comparator.comparingInt(NodeView::sortOrder).thenComparing(NodeView::name);
    roots.sort(order);
    children.values().forEach(l -> l.sort(order));
    return new Snapshot(byId, bySlug, children, roots);
  }

  /** Drops the snapshot now and again after the surrounding transaction commits, so no reader caches stale rows. */
  public void invalidate() {
    snapshot = null;
    countsLoadedAt = 0;
    if (TransactionSynchronizationManager.isSynchronizationActive()) {
      TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
        @Override
        public void afterCommit() {
          snapshot = null;
          countsLoadedAt = 0;
        }
      });
    }
  }

  public void invalidateCounts() {
    countsLoadedAt = 0;
  }

  private Map<Long, Long> counts() {
    if (directCounts == null || System.currentTimeMillis() - countsLoadedAt > 60_000) {
      Map<Long, Long> m = new HashMap<>();
      for (Object[] row : posts.liveCountsByNode(Instant.now())) m.put((Long) row[0], (Long) row[1]);
      directCounts = m;
      countsLoadedAt = System.currentTimeMillis();
    }
    return directCounts;
  }

  public NodeView get(Long id) {
    NodeView v = id == null ? null : snap().byId().get(id);
    if (v == null) throw ApiException.notFound("Category");
    return v;
  }

  public Optional<NodeView> find(Long id) {
    return Optional.ofNullable(id == null ? null : snap().byId().get(id));
  }

  public NodeView getBySlug(String slug) {
    NodeView v = snap().bySlug().get(slug);
    if (v == null || !isVisible(v)) throw ApiException.notFound("Category");
    return v;
  }

  /** A node is visible to students only when it and all its ancestors are active. */
  public boolean isVisible(NodeView v) {
    for (Crumb c : breadcrumb(v.id())) {
      if (!snap().byId().get(c.id()).active()) return false;
    }
    return true;
  }

  public List<Crumb> breadcrumb(Long nodeId) {
    List<Crumb> out = new ArrayList<>();
    NodeView v = snap().byId().get(nodeId);
    while (v != null) {
      out.add(0, new Crumb(v.id(), v.shortName() != null && !v.shortName().isBlank() ? v.shortName() : v.name(), v.slug(), v.typeLabel()));
      v = v.parentId() == null ? null : snap().byId().get(v.parentId());
    }
    return out;
  }

  /** "Class 10 › Science" style label for cards. Skips the top-level stream to keep it short. */
  public String pathLabel(Long nodeId) {
    List<Crumb> crumbs = breadcrumb(nodeId);
    List<Crumb> shown = crumbs.size() > 2 ? crumbs.subList(crumbs.size() - 2, crumbs.size()) : crumbs;
    return String.join(" › ", shown.stream().map(Crumb::name).toList());
  }

  public String fullPathText(Long nodeId) {
    return String.join(" ", breadcrumb(nodeId).stream().map(c -> snap().byId().get(c.id()).name()).toList());
  }

  public List<TreeNode> tree(boolean includeInactive) {
    Map<Long, Long> direct = counts();
    Map<Long, Long> rolled = new HashMap<>();
    List<TreeNode> out = new ArrayList<>();
    for (NodeView r : snap().roots()) {
      if (includeInactive || r.active()) out.add(build(r, includeInactive, direct, rolled));
    }
    return out;
  }

  private TreeNode build(NodeView v, boolean includeInactive, Map<Long, Long> direct, Map<Long, Long> rolled) {
    List<TreeNode> kids = new ArrayList<>();
    long total = direct.getOrDefault(v.id(), 0L);
    for (NodeView c : snap().children().getOrDefault(v.id(), List.of())) {
      if (!includeInactive && !c.active()) continue;
      TreeNode t = build(c, includeInactive, direct, rolled);
      total += t.postCount();
      kids.add(t);
    }
    return new TreeNode(v.id(), v.parentId(), v.name(), v.shortName(), v.slug(), v.description(), v.icon(), v.color(),
        v.coverImage(), v.typeId(), v.typeCode(), v.typeLabel(), v.depth(), v.sortOrder(), v.active(), v.featured(),
        total, kids);
  }

  public TreeNode subtree(Long nodeId) {
    NodeView v = get(nodeId);
    return build(v, false, counts(), new HashMap<>());
  }

  @Transactional(readOnly = true)
  public NodePage page(String slug) {
    NodeView v = getBySlug(slug);
    TreeNode t = subtree(v.id());
    Map<Long, ContentType> types = new HashMap<>();
    contentTypes.findByActiveTrueOrderBySortOrderAscIdAsc().forEach(ct -> types.put(ct.getId(), ct));
    List<ContentTypeCount> typeCounts = new ArrayList<>();
    for (Object[] row : posts.liveCountsByTypeUnder(v.path() + "%", Instant.now())) {
      ContentType ct = types.get((Long) row[0]);
      if (ct != null) typeCounts.add(new ContentTypeCount(ct.getId(), ct.getCode(), ct.getName(), ct.getIcon(), ct.getColor(), (Long) row[1]));
    }
    typeCounts.sort(Comparator.comparingInt(c -> types.get(c.id()).getSortOrder()));
    return new NodePage(v, breadcrumb(v.id()), t.children(), t.postCount(), typeCounts);
  }

  public List<NodeView> featured() {
    return snap().byId().values().stream().filter(v -> v.featured() && isVisible(v))
        .sorted(Comparator.comparingInt(NodeView::depth).thenComparingInt(NodeView::sortOrder)).toList();
  }

  public List<NodeView> search(String q, int limit) {
    String needle = q.toLowerCase(Locale.ROOT);
    return snap().byId().values().stream()
        .filter(v -> isVisible(v) && (v.name().toLowerCase(Locale.ROOT).contains(needle)
            || (v.shortName() != null && v.shortName().toLowerCase(Locale.ROOT).contains(needle))
            || fullPathText(v.id()).toLowerCase(Locale.ROOT).contains(needle)))
        .sorted(Comparator.comparing((NodeView v) -> !v.name().toLowerCase(Locale.ROOT).startsWith(needle))
            .thenComparing(v -> -v.depth()))
        .limit(limit).toList();
  }

  // ------------------------------------------------------------------ writes (admin)

  @Transactional
  public NodeView create(NodeForm f) {
    CatalogNode n = new CatalogNode();
    apply(n, f, true);
    nodes.save(n);
    n.setPath((n.getParent() == null ? "/" : n.getParent().getPath()) + n.getId() + "/");
    audit.log("CREATE", "CATEGORY", n.getId(), n.getName());
    invalidate();
    return NodeView.of(n);
  }

  @Transactional
  public NodeView update(Long id, NodeForm f) {
    CatalogNode n = nodes.findById(id).orElseThrow(() -> ApiException.notFound("Category"));
    Long oldParent = n.getParentId();
    apply(n, f, false);
    if (!Objects.equals(oldParent, n.getParentId())) rePath(n);
    audit.log("UPDATE", "CATEGORY", n.getId(), n.getName());
    invalidate();
    return NodeView.of(n);
  }

  private void apply(CatalogNode n, NodeForm f, boolean creating) {
    NodeType type = nodeTypes.findById(f.typeId()).orElseThrow(() -> ApiException.badRequest("Unknown level type"));
    CatalogNode parent = null;
    if (f.parentId() != null) {
      parent = nodes.findById(f.parentId()).orElseThrow(() -> ApiException.badRequest("Parent not found"));
      if (!creating && (parent.getId().equals(n.getId()) || parent.getPath().startsWith(n.getPath()))) {
        throw ApiException.badRequest("A category cannot be moved inside itself.");
      }
    }
    n.setParent(parent);
    n.setNodeType(type);
    n.setName(f.name().trim());
    n.setShortName(blankToNull(f.shortName()));
    n.setDescription(blankToNull(f.description()));
    n.setIcon(blankToNull(f.icon()));
    n.setColor(blankToNull(f.color()));
    n.setCoverImage(blankToNull(f.coverImage()));
    if (f.sortOrder() != null) n.setSortOrder(f.sortOrder());
    if (f.active() != null) n.setActive(f.active());
    if (f.featured() != null) n.setFeatured(f.featured());
    n.setDepth(parent == null ? 0 : parent.getDepth() + 1);
    String wanted = f.slug() != null && !f.slug().isBlank() ? Slugs.slugify(f.slug()) : null;
    if (wanted == null && creating) {
      // Subject names repeat across classes ("Science" in Class 8, 9, 10), so prefix with the parent's slug.
      String base = Slugs.slugify(f.name());
      wanted = nodes.existsBySlug(base) && parent != null ? parent.getSlug() + "-" + base : base;
    }
    if (wanted != null && !wanted.equals(n.getSlug())) {
      n.setSlug(Slugs.unique(wanted, nodes::existsBySlug));
    }
    if (creating) n.setPath("/");
  }

  private void rePath(CatalogNode n) {
    String oldPrefix = n.getPath();
    String newPrefix = (n.getParent() == null ? "/" : n.getParent().getPath()) + n.getId() + "/";
    int depthDelta = n.getDepth() - (oldPrefix.split("/").length - 2);
    for (CatalogNode d : nodes.findByPathStartingWith(oldPrefix)) {
      d.setPath(newPrefix + d.getPath().substring(oldPrefix.length()));
      if (!d.getId().equals(n.getId())) d.setDepth(d.getDepth() + depthDelta);
    }
    n.setPath(newPrefix);
  }

  @Transactional
  public void reorder(List<ReorderItem> items) {
    for (ReorderItem item : items) {
      CatalogNode n = nodes.findById(item.id()).orElseThrow(() -> ApiException.notFound("Category"));
      n.setSortOrder(item.sortOrder());
      if (!Objects.equals(n.getParentId(), item.parentId())) {
        CatalogNode parent = item.parentId() == null ? null : nodes.findById(item.parentId()).orElseThrow();
        if (parent != null && parent.getPath().startsWith(n.getPath())) throw ApiException.badRequest("Cannot move a category inside itself.");
        n.setParent(parent);
        n.setDepth(parent == null ? 0 : parent.getDepth() + 1);
        rePath(n);
      }
    }
    invalidate();
  }

  @Transactional
  public void delete(Long id) {
    CatalogNode n = nodes.findById(id).orElseThrow(() -> ApiException.notFound("Category"));
    if (nodes.countByParent_Id(id) > 0) throw ApiException.conflict("Remove or move its sub-categories first.");
    if (posts.countByNodeId(id) > 0) throw ApiException.conflict("Move or delete the posts in this category first.");
    if (quizzes.countByNodeId(id) > 0) throw ApiException.conflict("Move or delete the quizzes in this category first.");
    nodes.delete(n);
    audit.log("DELETE", "CATEGORY", id, n.getName());
    invalidate();
  }

  // ------------------------------------------------------------------ level types & content types

  public List<NodeType> nodeTypes() {
    return nodeTypes.findAllByOrderBySortOrderAscIdAsc();
  }

  @Transactional
  public NodeType saveNodeType(Long id, NodeTypeForm f) {
    NodeType t = id == null ? new NodeType() : nodeTypes.findById(id).orElseThrow(() -> ApiException.notFound("Level type"));
    String code = f.code().trim().toUpperCase(Locale.ROOT).replaceAll("[^A-Z0-9_]", "_");
    if (!code.equals(t.getCode()) && nodeTypes.existsByCodeIgnoreCase(code)) throw ApiException.conflict("Code already used");
    t.setCode(code);
    t.setLabel(f.label().trim());
    t.setIcon(blankToNull(f.icon()));
    t.setSortOrder(f.sortOrder() == null ? 0 : f.sortOrder());
    nodeTypes.save(t);
    audit.log(id == null ? "CREATE" : "UPDATE", "LEVEL_TYPE", t.getId(), t.getLabel());
    invalidate();
    return t;
  }

  @Transactional
  public void deleteNodeType(Long id) {
    if (nodes.countByNodeType_Id(id) > 0) throw ApiException.conflict("This level type is used by categories.");
    nodeTypes.deleteById(id);
    audit.log("DELETE", "LEVEL_TYPE", id, null);
  }

  public List<ContentType> contentTypes(boolean activeOnly) {
    return activeOnly ? contentTypes.findByActiveTrueOrderBySortOrderAscIdAsc() : contentTypes.findAllByOrderBySortOrderAscIdAsc();
  }

  @Transactional
  public ContentType saveContentType(Long id, ContentTypeForm f) {
    ContentType t = id == null ? new ContentType() : contentTypes.findById(id).orElseThrow(() -> ApiException.notFound("Content type"));
    String code = f.code().trim().toUpperCase(Locale.ROOT).replaceAll("[^A-Z0-9_]", "_");
    if (!code.equals(t.getCode()) && contentTypes.existsByCodeIgnoreCase(code)) throw ApiException.conflict("Code already used");
    t.setCode(code);
    t.setName(f.name().trim());
    t.setIcon(blankToNull(f.icon()));
    t.setColor(blankToNull(f.color()));
    t.setSortOrder(f.sortOrder() == null ? 0 : f.sortOrder());
    if (f.active() != null) t.setActive(f.active());
    contentTypes.save(t);
    audit.log(id == null ? "CREATE" : "UPDATE", "CONTENT_TYPE", t.getId(), t.getName());
    return t;
  }

  @Transactional
  public void deleteContentType(Long id) {
    if (posts.countByContentTypeId(id) > 0) throw ApiException.conflict("Posts use this content type; deactivate it instead.");
    contentTypes.deleteById(id);
    audit.log("DELETE", "CONTENT_TYPE", id, null);
  }

  private static String blankToNull(String s) {
    return s == null || s.isBlank() ? null : s.trim();
  }
}
