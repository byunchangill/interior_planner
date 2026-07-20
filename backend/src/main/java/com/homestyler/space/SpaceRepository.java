package com.homestyler.space;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SpaceRepository extends JpaRepository<Space, Long> {

    List<Space> findByUserIdOrderByIdDesc(Long userId);

    long countByUserId(Long userId);
}
