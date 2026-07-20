package com.homestyler.space;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

/**
 * M5(MY/DATA): 전 공간의 원본 사진·도면을 사용자 단위로 조회·삭제하기 위한 저장소.
 * 공간(Space)을 경유하지 않고 사진 행을 직접 다룬다.
 */
public interface SpacePhotoRepository extends JpaRepository<SpacePhoto, Long> {

    @Query("select p from SpacePhoto p join fetch p.space s where s.userId = :userId order by p.id asc")
    List<SpacePhoto> findAllByUser(@Param("userId") Long userId);

    @Query("select count(p) from SpacePhoto p join p.space s where s.userId = :userId")
    long countByUser(@Param("userId") Long userId);

    @Query("select p from SpacePhoto p join fetch p.space s where p.id in :ids order by p.id asc")
    List<SpacePhoto> findByIds(@Param("ids") Collection<Long> ids);
}
