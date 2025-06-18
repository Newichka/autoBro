package com.autobro.repository;

import com.autobro.model.SafetyFeature;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SafetyFeatureRepository extends JpaRepository<SafetyFeature, Long> {
    // Поиск по типу характеристики
    List<SafetyFeature> findByFeatureType(String featureType);

    Optional<SafetyFeature> findByName(String name);
} 