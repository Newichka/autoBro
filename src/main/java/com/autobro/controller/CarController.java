package com.autobro.controller;

import com.autobro.dto.ApiResponse;
import com.autobro.dto.CarDTO;
import com.autobro.dto.CarFilterDTO;
import com.autobro.service.CarService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/cars")
@RequiredArgsConstructor
@Tag(name = "Cars", description = "API для работы с автомобилями")
@CrossOrigin(origins = {"http://localhost:5000", "http://localhost:3000", "http://localhost:8080", 
                        "http://127.0.0.1:5000", "http://127.0.0.1:3000"})
public class CarController {

    private final CarService carService;

    @GetMapping("/{id}")
    @Operation(summary = "Получить информацию об автомобиле по ID")
    public ResponseEntity<ApiResponse<CarDTO>> getCarById(
            @Parameter(description = "ID автомобиля") 
            @PathVariable Long id) {
        CarDTO car = carService.getCarById(id);
        return ResponseEntity.ok(ApiResponse.success(car));
    }

    @PostMapping
    @Operation(summary = "Создать новый автомобиль")
    public ResponseEntity<ApiResponse<CarDTO>> createCar(
            @Parameter(description = "Данные автомобиля")
            @RequestBody CarDTO carDTO) {
        CarDTO created = carService.createCar(carDTO);
        return ResponseEntity.ok(ApiResponse.success(created, "Автомобиль успешно создан"));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Обновить информацию об автомобиле")
    public ResponseEntity<ApiResponse<CarDTO>> updateCar(
            @Parameter(description = "ID автомобиля")
            @PathVariable Long id,
            @Parameter(description = "Обновленные данные автомобиля")
            @RequestBody CarDTO carDTO) {
        CarDTO updated = carService.updateCar(id, carDTO);
        return ResponseEntity.ok(ApiResponse.success(updated, "Автомобиль успешно обновлен"));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Удалить автомобиль")
    public ResponseEntity<ApiResponse<Void>> deleteCar(
            @Parameter(description = "ID автомобиля")
            @PathVariable Long id) {
        carService.deleteCar(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Автомобиль успешно удален"));
    }

    @PostMapping("/{id}/photos")
    @Operation(summary = "Загрузить фотографии автомобиля")
    public ResponseEntity<ApiResponse<List<String>>> uploadPhotos(
            @Parameter(description = "ID автомобиля")
            @PathVariable Long id,
            @Parameter(description = "Файлы фотографий")
            @RequestParam("files") List<MultipartFile> files) {
        List<String> photoUrls = carService.uploadPhotos(id, files);
        return ResponseEntity.ok(ApiResponse.success(photoUrls, "Фотографии успешно загружены"));
    }

    @DeleteMapping("/{id}/photos/{photoId}")
    @Operation(summary = "Удалить фотографию автомобиля")
    public ResponseEntity<ApiResponse<Void>> deletePhoto(
            @Parameter(description = "ID автомобиля")
            @PathVariable Long id,
            @Parameter(description = "ID фотографии")
            @PathVariable Long photoId) {
        carService.deletePhoto(id, photoId);
        return ResponseEntity.ok(ApiResponse.success(null, "Фотография успешно удалена"));
    }

    @GetMapping
    @Operation(summary = "Поиск автомобилей с фильтрацией")
    public ResponseEntity<ApiResponse<List<CarDTO>>> findCars(
            @Parameter(description = "Фильтр для поиска") 
            CarFilterDTO filter) {
        Page<CarDTO> cars = carService.findCars(filter);
        return ResponseEntity.ok(ApiResponse.success(cars));
    }

    @GetMapping("/makes")
    @Operation(summary = "Получить список всех марок автомобилей")
    public ResponseEntity<ApiResponse<List<String>>> getAllMakes() {
        List<String> makes = carService.getAllMakes();
        return ResponseEntity.ok(ApiResponse.success(makes));
    }

    @GetMapping("/models")
    public ResponseEntity<ApiResponse<List<String>>> getModelsByMake(@RequestParam String makes) {
        List<String> models = carService.getModelsByMake(makes);
        return ResponseEntity.ok(ApiResponse.success(models));
    }

    @PostMapping("/models/by-makes")
    public ResponseEntity<ApiResponse<List<String>>> getModelsByMakes(@RequestBody Map<String, List<String>> request) {
        List<String> makes = request.get("makes");
        if (makes == null || makes.isEmpty()) {
            return ResponseEntity.ok(ApiResponse.success(Collections.emptyList()));
        }
        
        List<String> models = carService.getModelsByMakes(makes);
        return ResponseEntity.ok(ApiResponse.success(models));
    }

    @GetMapping("/years")
    @Operation(summary = "Получить диапазон годов выпуска")
    public ResponseEntity<ApiResponse<Map<String, Integer>>> getYearRange() {
        Map<String, Integer> yearRange = carService.getYearRange();
        return ResponseEntity.ok(ApiResponse.success(yearRange));
    }

    @GetMapping("/price-range")
    @Operation(summary = "Получить диапазон цен")
    public ResponseEntity<ApiResponse<Map<String, BigDecimal>>> getPriceRange() {
        Map<String, BigDecimal> priceRange = carService.getPriceRange();
        return ResponseEntity.ok(ApiResponse.success(priceRange));
    }
} 