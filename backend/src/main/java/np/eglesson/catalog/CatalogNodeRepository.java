package np.eglesson.catalog;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CatalogNodeRepository extends JpaRepository<CatalogNode, Long> {
  Optional<CatalogNode> findBySlug(String slug);

  boolean existsBySlug(String slug);

  List<CatalogNode> findAllByOrderByDepthAscSortOrderAscNameAsc();

  List<CatalogNode> findByPathStartingWith(String pathPrefix);

  long countByParent_Id(Long parentId);

  long countByNodeType_Id(Long nodeTypeId);

  @Query("select n from CatalogNode n where n.active = true and (lower(n.name) like :q or lower(n.shortName) like :q) order by n.depth desc, n.name")
  List<CatalogNode> searchActive(@Param("q") String likeLower, org.springframework.data.domain.Pageable pageable);
}
