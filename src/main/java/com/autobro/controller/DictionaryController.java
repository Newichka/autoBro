package com.autobro.controller;

import com.autobro.dto.ApiResponse;
import com.autobro.model.*;
import com.autobro.repository.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Arrays;
import java.util.List;

@RestController
@RequestMapping("/api/dictionary")
@RequiredArgsConstructor
@Tag(name = "Dictionary", description = "API для работы со справочниками")
public class DictionaryController {
    private final BodyTypeRepository bodyTypeRepository;
    private final ColorRepository colorRepository;
    private final EquipmentRepository equipmentRepository;
    private final SafetyFeatureRepository safetyFeatureRepository;

    @GetMapping("/body-types")
    @Operation(summary = "Получить список типов кузова")
    public ResponseEntity<ApiResponse<List<BodyType>>> getBodyTypes() {
        return ResponseEntity.ok(ApiResponse.success(bodyTypeRepository.findAll()));
    }

    @GetMapping("/colors")
    @Operation(summary = "Получить список цветов")
    public ResponseEntity<ApiResponse<List<Color>>> getColors() {
        return ResponseEntity.ok(ApiResponse.success(colorRepository.findAll()));
    }

    @GetMapping("/equipment")
    @Operation(summary = "Получить список комплектации")
    public ResponseEntity<ApiResponse<List<Equipment>>> getEquipment() {
        return ResponseEntity.ok(ApiResponse.success(equipmentRepository.findAll()));
    }

    @GetMapping("/safety-features")
    @Operation(summary = "Получить список характеристик безопасности")
    public ResponseEntity<ApiResponse<List<SafetyFeature>>> getSafetyFeatures() {
        return ResponseEntity.ok(ApiResponse.success(safetyFeatureRepository.findAll()));
    }

    @GetMapping("/fuel-types")
    @Operation(summary = "Получить список типов топлива")
    public ResponseEntity<ApiResponse<List<String>>> getFuelTypes() {
        List<String> fuelTypes = Arrays.asList(
                "Бензин", "Дизель", "Газ", "Электричество", "Гибрид"
        );
        return ResponseEntity.ok(ApiResponse.success(fuelTypes));
    }

    @GetMapping("/transmission-types")
    @Operation(summary = "Получить список типов трансмиссий")
    public ResponseEntity<ApiResponse<List<String>>> getTransmissionTypes() {
        List<String> transmissionTypes = Arrays.asList(
                "Механическая", "Автоматическая", "Робот", "Вариатор"
        );
        return ResponseEntity.ok(ApiResponse.success(transmissionTypes));
    }

    @GetMapping("/drive-types")
    @Operation(summary = "Получить список типов привода")
    public ResponseEntity<ApiResponse<List<String>>> getDriveTypes() {
        List<String> driveTypes = Arrays.asList(
                "Передний", "Задний", "Полный"
        );
        return ResponseEntity.ok(ApiResponse.success(driveTypes));
    }

    @GetMapping("/equipment-categories")
    @Operation(summary = "Получить список категорий комплектации")
    public ResponseEntity<ApiResponse<List<String>>> getEquipmentCategories() {
        List<String> categories = Arrays.asList(
                "Комфорт", "Безопасность", "Экстерьер", "Интерьер", "Мультимедиа"
        );
        return ResponseEntity.ok(ApiResponse.success(categories));
    }

    @GetMapping("/feature-types")
    @Operation(summary = "Получить список типов характеристик безопасности")
    public ResponseEntity<ApiResponse<List<String>>> getFeatureTypes() {
        List<String> featureTypes = Arrays.asList(
                "Активная безопасность", "Пассивная безопасность", "Противоугонные системы"
        );
        return ResponseEntity.ok(ApiResponse.success(featureTypes));
    }
} 