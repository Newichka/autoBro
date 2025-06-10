package com.autobro.repository;

import com.autobro.model.Photo;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PhotoRepository extends JpaRepository<Photo, Long> {
    // Поиск фотографий по ID автомобиля
    List<Photo> findByCarId(Long carId);

    // Удаление всех фотографий автомобиля
    void deleteByCarId(Long carId);
} 