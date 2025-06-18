package com.autobro.repository;

import com.autobro.model.TechnicalSpec;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TechnicalSpecRepository extends JpaRepository<TechnicalSpec, Long> {
    // Поиск характеристик по ID автомобиля
    TechnicalSpec findByCarId(Long carId);

} 