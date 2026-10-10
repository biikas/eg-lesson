package np.eglesson.catalog;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NodeTypeRepository extends JpaRepository<NodeType, Long> {
  Optional<NodeType> findByCode(String code);

  boolean existsByCodeIgnoreCase(String code);

  List<NodeType> findAllByOrderBySortOrderAscIdAsc();
}
