package com.autobro.repository;

import com.autobro.model.Equipment;
import com.autobro.model.enums.EquipmentCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EquipmentRepository extends JpaRepository<Equipment, Long> {
    // Поиск по категории оборудования
    List<Equipment> findByCategory(EquipmentCategory category);

    // Поиск стандартного оборудования
    List<Equipment> findByIsStandardTrue();

    // Поиск по названию
    List<Equipment> findByNameContainingIgnoreCase(String name);

    // Поиск по категории и стандартности
    List<Equipment> findByCategoryAndIsStandard(EquipmentCategory category, Boolean isStandard);

    // Поиск по названию
    Optional<Equipment> findByName(String name);
} 