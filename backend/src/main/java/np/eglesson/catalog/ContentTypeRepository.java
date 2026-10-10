package np.eglesson.catalog;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ContentTypeRepository extends JpaRepository<ContentType, Long> {
  Optional<ContentType> findByCode(String code);

  boolean existsByCodeIgnoreCase(String code);

  List<ContentType> findAllByOrderBySortOrderAscIdAsc();

  List<ContentType> findByActiveTrueOrderBySortOrderAscIdAsc();
}
