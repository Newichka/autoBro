package com.autobro.controller;

import com.autobro.dto.ApiResponse;
import com.autobro.dto.CarDTO;
import com.autobro.dto.CarFilterDTO;
import com.autobro.dto.CreateCarDTO;
import com.autobro.dto.TechnicalSpecDTO;
import com.autobro.model.Car;
import com.autobro.model.Photo;
import com.autobro.model.TechnicalSpec;
import com.autobro.repository.BodyTypeRepository;
import com.autobro.repository.ColorRepository;
import com.autobro.repository.TechnicalSpecRepository;
import com.autobro.service.CarService;
import com.autobro.service.FileStorageService;
import com.autobro.service.PhotoService;
import com.fasterxml.jackson.databind.ObjectMapper;
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
    private final FileStorageService fileStorageService;
    private final PhotoService photoService;
    private final BodyTypeRepository bodyTypeRepository;
    private final ColorRepository colorRepository;
    private final TechnicalSpecRepository technicalSpecRepository;

    @GetMapping("/{id}")
    @Operation(summary = "Получить информацию об автомобиле по ID")
    public ResponseEntity<ApiResponse<CarDTO>> getCarById(
            @Parameter(description = "ID автомобиля") 
            @PathVariable Long id) {
        CarDTO car = carService.getCarById(id);
        return ResponseEntity.ok(ApiResponse.success(car));
    }

    @PostMapping("/create")
    public ResponseEntity<CarDTO> createCar(@RequestBody CarDTO carDTO) {
        return ResponseEntity.ok(carService.createCar(carDTO));
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
    @Operation(summary = "Обновить фотографии автомобиля (удаляет старые, добавляет новые)")
    public ResponseEntity<ApiResponse<List<String>>> updatePhotos(
            @PathVariable Long id,
            @RequestParam(value = "files") List<MultipartFile> files) {
        carService.deleteAllPhotos(id);
        List<String> photoUrls = carService.uploadPhotos(id, files);
        return ResponseEntity.ok(ApiResponse.success(photoUrls, "Фотографии успешно обновлены"));
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

    @PostMapping
    public ResponseEntity<?> createCarWithPhotos(
            @RequestParam("car") String carJson,
            @RequestParam(value = "mainPhoto", required = false) MultipartFile mainPhoto,
            @RequestParam(value = "additionalPhotos", required = false) MultipartFile[] additionalPhotos) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            CreateCarDTO dto = mapper.readValue(carJson, CreateCarDTO.class);
            
            // Сначала создаем авто без фото
            Car car = new Car();
            car.setMake(dto.getMake());
            car.setModel(dto.getModel());
            car.setYear(dto.getYear());
            car.setPrice(dto.getPrice());
            car.setMileage(dto.getMileage());
            car.setCarCondition(dto.getCarCondition());
            car.setLocation(dto.getLocation());
            
            // bodyType
            if (dto.getBodyTypeId() != null) {
                car.setBodyType(bodyTypeRepository.findById(dto.getBodyTypeId()).orElse(null));
            }
            
            // color
            if (dto.getColorId() != null) {
                car.setColor(colorRepository.findById(dto.getColorId()).orElse(null));
            }
            
            // Сохраняем авто, чтобы получить ID
            Car savedCar = carService.save(car);
            
            // Сохраняем главное фото
            if (mainPhoto != null && !mainPhoto.isEmpty()) {
                String mainPhotoPath = fileStorageService.storeFile(mainPhoto, savedCar.getId());
                car.setMainPhotoUrl(mainPhotoPath);
                
                // Создаем запись в БД для главного фото
                Photo mainPhotoEntity = new Photo();
                mainPhotoEntity.setCar(savedCar);
                mainPhotoEntity.setUrl(mainPhotoPath);
                mainPhotoEntity.setMainPhoto(true);
                photoService.save(mainPhotoEntity);
            }
            
            // Сохраняем дополнительные фото
            if (additionalPhotos != null) {
                for (MultipartFile photo : additionalPhotos) {
                    if (photo != null && !photo.isEmpty()) {
                        String photoPath = fileStorageService.storeFile(photo, savedCar.getId());
                        
                        Photo photoEntity = new Photo();
                        photoEntity.setCar(savedCar);
                        photoEntity.setUrl(photoPath);
                        photoEntity.setMainPhoto(false);
                        photoService.save(photoEntity);
                    }
                }
            }
            
            // Добавить:
            if (dto.getTechnicalSpec() != null) {
                TechnicalSpec spec = new TechnicalSpec();
                spec.setCar(savedCar);
                TechnicalSpecDTO specDTO = dto.getTechnicalSpec();
                if (specDTO.getFuelType() != null) spec.setFuelType(specDTO.getFuelType());
                if (specDTO.getEngineVolume() != null) spec.setEngineVolume(specDTO.getEngineVolume());
                if (specDTO.getHorsePower() != null) spec.setHorsePower(specDTO.getHorsePower());
                if (specDTO.getDriveType() != null) spec.setDriveType(specDTO.getDriveType());
                if (specDTO.getTransmissionType() != null) spec.setTransmissionType(specDTO.getTransmissionType());
                if (specDTO.getGears() != null) spec.setGears(specDTO.getGears());
                if (specDTO.getEngineInfo() != null) spec.setEngineInfo(specDTO.getEngineInfo());
                if (specDTO.getTransmissionInfo() != null) spec.setTransmissionInfo(specDTO.getTransmissionInfo());
                TechnicalSpec savedSpec = technicalSpecRepository.save(spec);
                savedCar.setTechnicalSpec(savedSpec);
                carService.save(savedCar);
            }
            
            // Обновляем авто с фото
            savedCar = carService.save(car);
            return ResponseEntity.ok(savedCar);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Ошибка: " + e.getMessage());
        }
    }
} 