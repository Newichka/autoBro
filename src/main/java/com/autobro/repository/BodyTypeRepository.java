package com.autobro.repository;

import com.autobro.model.BodyType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BodyTypeRepository extends JpaRepository<BodyType, Long> {
    Optional<BodyType> findByName(String name);
} 