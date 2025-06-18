package com.autobro.repository;

import com.autobro.model.Car;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

public interface CarRepository extends JpaRepository<Car, Long> {
    // Базовый поиск по марке (используется для получения моделей)
    List<Car> findByMakeIgnoreCase(String make);

    // Основной метод поиска с фильтрами и пагинацией - нативный SQL запрос для PostgreSQL
    @Query(value = "SELECT c.* FROM cars c " +
           "LEFT JOIN body_types bt ON bt.id = c.body_type_id " +
           "LEFT JOIN colors cl ON cl.id = c.color_id " +
           "LEFT JOIN car_tech_specs ts ON ts.car_id = c.id " +
           "WHERE (:#{#make.size()} = 0 OR c.make IN (:make)) " +
           "AND (:model IS NULL OR c.model = :model) " +
           "AND (:minYear IS NULL OR c.year >= :minYear) " +
           "AND (:maxYear IS NULL OR c.year <= :maxYear) " +
           "AND (:minPrice IS NULL OR c.price >= :minPrice) " +
           "AND (:maxPrice IS NULL OR c.price <= :maxPrice) " +
           "AND (:maxMileage IS NULL OR c.mileage <= :maxMileage) " +
           "AND (:bodyTypeId IS NULL OR bt.id = :bodyTypeId) " +
           "AND (:colorId IS NULL OR cl.id = :colorId) " +
           "AND (:fuelType IS NULL OR (ts.fuel_type = :fuelType)) " +
           "AND (:minHorsePower IS NULL OR (ts.horse_power >= :minHorsePower)) " +
           "AND (:transmissionType IS NULL OR (ts.transmission_type = :transmissionType)) " +
           "AND (:driveType IS NULL OR (ts.drive_type = :driveType)) " +
           "AND (:country IS NULL OR :country = '' OR c.location IS NULL OR c.location ILIKE '%' || :country || '%') " +
           "AND (:city IS NULL OR :city = '' OR c.location IS NULL OR c.location ILIKE '%' || :city || '%')",
           countQuery = "SELECT COUNT(c.id) FROM cars c " +
           "LEFT JOIN body_types bt ON bt.id = c.body_type_id " +
           "LEFT JOIN colors cl ON cl.id = c.color_id " +
           "LEFT JOIN car_tech_specs ts ON ts.car_id = c.id " +
           "WHERE (:#{#make.size()} = 0 OR c.make IN (:make)) " +
           "AND (:model IS NULL OR c.model = :model) " +
           "AND (:minYear IS NULL OR c.year >= :minYear) " +
           "AND (:maxYear IS NULL OR c.year <= :maxYear) " +
           "AND (:minPrice IS NULL OR c.price >= :minPrice) " +
           "AND (:maxPrice IS NULL OR c.price <= :maxPrice) " +
           "AND (:maxMileage IS NULL OR c.mileage <= :maxMileage) " +
           "AND (:bodyTypeId IS NULL OR bt.id = :bodyTypeId) " +
           "AND (:colorId IS NULL OR cl.id = :colorId) " +
           "AND (:fuelType IS NULL OR (ts.fuel_type = :fuelType)) " +
           "AND (:minHorsePower IS NULL OR (ts.horse_power >= :minHorsePower)) " +
           "AND (:transmissionType IS NULL OR (ts.transmission_type = :transmissionType)) " +
           "AND (:driveType IS NULL OR (ts.drive_type = :driveType)) " +
           "AND (:country IS NULL OR :country = '' OR c.location IS NULL OR c.location ILIKE '%' || :country || '%') " +
           "AND (:city IS NULL OR :city = '' OR c.location IS NULL OR c.location ILIKE '%' || :city || '%')",
           nativeQuery = true)
    Page<Car> findWithFilters(
        @Param("make") List<String> make,
        @Param("model") String model,
        @Param("minYear") Integer minYear,
        @Param("maxYear") Integer maxYear,
        @Param("minPrice") BigDecimal minPrice,
        @Param("maxPrice") BigDecimal maxPrice,
        @Param("maxMileage") Integer maxMileage,
        @Param("bodyTypeId") Long bodyTypeId,
        @Param("fuelType") String fuelType,
        @Param("minHorsePower") Integer minHorsePower,
        @Param("transmissionType") String transmissionType,
        @Param("driveType") String driveType,
        @Param("colorId") Long colorId,
        @Param("country") String country,
        @Param("city") String city,
        Pageable pageable
    );

    // Получение автомобиля со всеми связанными данными
    @Query("SELECT c FROM Car c " +
           "LEFT JOIN FETCH c.bodyType " +
           "LEFT JOIN FETCH c.color " +
           "LEFT JOIN FETCH c.photos " +
           "LEFT JOIN FETCH c.safetyFeatures " +
           "LEFT JOIN FETCH c.equipment " +
           "LEFT JOIN FETCH c.technicalSpec " +
           "WHERE c.id = :id")
    Optional<Car> findByIdWithAllDetails(@Param("id") Long id);
} 