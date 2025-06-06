package com.autobro.service;

import com.autobro.dto.CarDTO;
import com.autobro.dto.CarFilterDTO;
import com.autobro.dto.TechnicalSpecDTO;
import com.autobro.exception.NotFoundException;
import com.autobro.exception.ValidationException;
import com.autobro.model.*;
import com.autobro.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;
import java.util.stream.Collectors;
import java.nio.file.StandardCopyOption;

@Service
@RequiredArgsConstructor
public class CarService {
    private final CarRepository carRepository;
    private final PhotoRepository photoRepository;
    private final TechnicalSpecRepository technicalSpecRepository;
    private final EquipmentRepository equipmentRepository;
    private final SafetyFeatureRepository safetyFeatureRepository;
    private final BodyTypeRepository bodyTypeRepository;
    private final ColorRepository colorRepository;


    @Value("${app.upload.path}")
    private String uploadPath;

    @Transactional(readOnly = true)
    public CarDTO getCarById(Long id) {
        Car car = carRepository.findByIdWithAllDetails(id)
            .orElseThrow(() -> new NotFoundException("Car", id));
        return convertToDTO(car);
    }

    @Transactional(readOnly = true)
    public Page<CarDTO> findCars(CarFilterDTO filter) {
        // Определяем параметры сортировки
        String sortField = filter.getSortBy() != null ? filter.getSortBy() : "id";
        // Для сортировки с подчеркиванием в имени свойства необходимо обрабатывать особым образом
        if (sortField.equals("createdAt")) {
            sortField = "created_at"; // Используем actual_column_name в DB
        } else if (sortField.equals("updatedAt")) {
            sortField = "updated_at";
        }
        
        Sort.Direction direction = filter.getSortDirection() != null && 
                                  filter.getSortDirection().equalsIgnoreCase("desc") 
                                  ? Sort.Direction.DESC : Sort.Direction.ASC;
        
        PageRequest pageRequest = PageRequest.of(
            filter.getPage() != null ? filter.getPage() : 0,
            filter.getSize() != null ? filter.getSize() : 10,
            Sort.by(direction, sortField)
        );

        Page<Car> cars = findCars(filter, pageRequest);
        return cars.map(this::convertToDTO);
    }

    @Transactional(readOnly = true)
    public Page<Car> findCars(CarFilterDTO filter, Pageable pageable) {
        // Подготовка параметров для запроса
        // 1. Обработка списка марок
        List<String> make = filter.getMake();
        if (make == null) {
            make = new ArrayList<>();
        }
        
        // 2. Обработка модели
        String model = filter.getModel() != null ? filter.getModel() : null;
        
        // 3. Обработка технических характеристик
        String fuelType = null;
        if (filter.getFuelType() != null && !filter.getFuelType().isEmpty()) {
            fuelType = filter.getFuelType();
        }
        
        String transmissionType = null;
        if (filter.getTransmissionType() != null && !filter.getTransmissionType().isEmpty()) {
            transmissionType = filter.getTransmissionType();
        }
        
        String driveType = null;
        if (filter.getDriveType() != null && !filter.getDriveType().isEmpty()) {
            driveType = filter.getDriveType();
        }
        
        // 4. Обработка местоположения
        String country = filter.getCountry() != null ? filter.getCountry() : null;
        String city = filter.getCity() != null ? filter.getCity() : null;
        
        // Вызов репозитория с подготовленными параметрами
        return carRepository.findWithFilters(
            make, model, filter.getMinYear(), filter.getMaxYear(),
            filter.getMinPrice(), filter.getMaxPrice(), filter.getMaxMileage(),
            filter.getBodyTypeId(), fuelType, filter.getMinHorsePower(),
            transmissionType, driveType, filter.getColorId(),
            country, city, pageable);
    }

    @Transactional(readOnly = true)
    public List<String> getAllMakes() {
        return carRepository.findAll().stream()
            .map(Car::getMake)
            .distinct()
            .sorted()
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<String> getModelsByMake(String makes) {
        return carRepository.findByMakeIgnoreCase(makes).stream()
            .map(Car::getModel)
            .distinct()
            .sorted()
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<String> getModelsByMakes(List<String> makes) {
        List<String> allModels = new ArrayList<>();
        
        // Если список марок пуст, вернем пустой список
        if (makes == null || makes.isEmpty()) {
            return allModels;
        }
        
        // Для каждой марки получаем модели и добавляем их в общий список
        for (String make : makes) {
            try {
                List<String> modelsForMake = carRepository.findByMakeIgnoreCase(make).stream()
                    .map(Car::getModel)
                    .distinct()
                    .sorted()
                    .collect(Collectors.toList());
                
                allModels.addAll(modelsForMake);
            } catch (Exception e) {
                // Логгируем ошибку, но продолжаем обработку
                System.err.println("Ошибка при получении моделей для марки " + make + ": " + e.getMessage());
            }
        }
        
        // Возвращаем уникальные отсортированные модели
        return allModels.stream()
            .distinct()
            .sorted()
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Map<String, Integer> getYearRange() {
        List<Car> cars = carRepository.findAll();
        if (cars.isEmpty()) {
            return Map.of("minYear", 0, "maxYear", 0);
        }

        int minYear = cars.stream()
            .mapToInt(Car::getYear)
            .min()
            .orElse(0);

        int maxYear = cars.stream()
            .mapToInt(Car::getYear)
            .max()
            .orElse(0);

        return Map.of("minYear", minYear, "maxYear", maxYear);
    }

    @Transactional(readOnly = true)
    public Map<String, BigDecimal> getPriceRange() {
        List<Car> cars = carRepository.findAll();
        if (cars.isEmpty()) {
            return Map.of("minPrice", BigDecimal.ZERO, "maxPrice", BigDecimal.ZERO);
        }

        BigDecimal minPrice = cars.stream()
            .map(Car::getPrice)
            .min(BigDecimal::compareTo)
            .orElse(BigDecimal.ZERO);

        BigDecimal maxPrice = cars.stream()
            .map(Car::getPrice)
            .max(BigDecimal::compareTo)
            .orElse(BigDecimal.ZERO);

        return Map.of("minPrice", minPrice, "maxPrice", maxPrice);
    }

    @Transactional
    public CarDTO createCar(CarDTO carDTO) {
        Car car = new Car();
        
        // Обновляем базовые поля
        car.setMake(carDTO.getMake());
        car.setModel(carDTO.getModel());
        car.setYear(validateYear(carDTO.getYear()));
        car.setPrice(validatePrice(carDTO.getPrice()));
        car.setMileage(validateMileage(carDTO.getMileage()));

        // BodyType
        if (carDTO.getBodyTypeName() != null) {
            BodyType bodyType = bodyTypeRepository.findByName(carDTO.getBodyTypeName())
                .orElseGet(() -> {
                    BodyType newBodyType = new BodyType();
                    newBodyType.setName(carDTO.getBodyTypeName());
                    return bodyTypeRepository.save(newBodyType);
                });
            car.setBodyType(bodyType);
        }

        // Color с поддержкой hex-кода
        if (carDTO.getColorName() != null) {
            Color color = colorRepository.findByName(carDTO.getColorName())
                .orElseGet(() -> {
                    Color newColor = new Color();
                    newColor.setName(carDTO.getColorName());
                    // Устанавливаем hex-код, если он предоставлен
                    if (carDTO.getColorHexCode() != null && !carDTO.getColorHexCode().isEmpty()) {
                        newColor.setHexCode(carDTO.getColorHexCode());
                    }
                    return colorRepository.save(newColor);
                });
            
            // Обновляем hex-код существующего цвета, если он предоставлен
            if (carDTO.getColorHexCode() != null && !carDTO.getColorHexCode().isEmpty() && 
                (color.getHexCode() == null || !color.getHexCode().equals(carDTO.getColorHexCode()))) {
                color.setHexCode(carDTO.getColorHexCode());
                colorRepository.save(color);
            }
            
            car.setColor(color);
        }

        // Строковые поля вместо связанных сущностей
        car.setCarCondition(carDTO.getCondition());
        car.setLocation(carDTO.getLocation());
        car.setMainPhotoUrl(carDTO.getMainPhotoUrl());
        
        // Сначала сохраняем автомобиль
        car = carRepository.save(car);
        
        // Затем обрабатываем технические характеристики
        if (carDTO.getTechnicalSpec() != null) {
            try {
                TechnicalSpec spec = new TechnicalSpec();
                spec.setCar(car); // Устанавливаем связь с сохраненным автомобилем
                
                TechnicalSpecDTO specDTO = carDTO.getTechnicalSpec();
                
                // Обновляем все поля, которые присутствуют в DTO
                if (specDTO.getFuelType() != null) {
                    spec.setFuelType(specDTO.getFuelType());
                }
                if (specDTO.getEngineVolume() != null) {
                    spec.setEngineVolume(specDTO.getEngineVolume());
                }
                if (specDTO.getHorsePower() != null) {
                    spec.setHorsePower(specDTO.getHorsePower());
                }
                if (specDTO.getDriveType() != null) {
                    spec.setDriveType(specDTO.getDriveType());
                }
                if (specDTO.getTransmissionType() != null) {
                    spec.setTransmissionType(specDTO.getTransmissionType());
                }
                if (specDTO.getGears() != null) {
                    spec.setGears(specDTO.getGears());
                }
                
                // Добавляем информацию о двигателе и трансмиссии
                StringBuilder engineInfo = new StringBuilder();
                if (specDTO.getFuelType() != null) {
                    engineInfo.append(specDTO.getFuelType()).append(" ");
                }
                if (specDTO.getEngineVolume() != null) {
                    engineInfo.append(specDTO.getEngineVolume()).append("L ");
                }
                if (specDTO.getHorsePower() != null) {
                    engineInfo.append(specDTO.getHorsePower()).append("HP");
                }
                spec.setEngineInfo(engineInfo.toString().trim());
                
                StringBuilder transmissionInfo = new StringBuilder();
                if (specDTO.getTransmissionType() != null) {
                    transmissionInfo.append(specDTO.getTransmissionType());
                }
                spec.setTransmissionInfo(transmissionInfo.toString().trim());
                
                // Сохраняем технические характеристики
                spec = technicalSpecRepository.save(spec);
                car.setTechnicalSpec(spec);
                
                // Обновляем автомобиль с установленными техническими характеристиками
                car = carRepository.save(car);
            } catch (Exception e) {
                // Логируем ошибку, но продолжаем работу
                System.err.println("Ошибка при обновлении технических характеристик: " + e.getMessage());
                e.printStackTrace();
            }
        }
        
        // SafetyFeatures
        if (carDTO.getSafetyFeatures() != null && !carDTO.getSafetyFeatures().isEmpty()) {
            List<SafetyFeature> safetyFeatures = new ArrayList<>();
            for (String featureName : carDTO.getSafetyFeatures()) {
                SafetyFeature feature = safetyFeatureRepository.findByName(featureName)
                    .orElseGet(() -> {
                        SafetyFeature newFeature = new SafetyFeature();
                        newFeature.setName(featureName);
                        return safetyFeatureRepository.save(newFeature);
                    });
                safetyFeatures.add(feature);
            }
            car.setSafetyFeatures(safetyFeatures);
            car = carRepository.save(car);
        }

        // Equipment
        if (carDTO.getEquipment() != null && !carDTO.getEquipment().isEmpty()) {
            List<Equipment> equipment = new ArrayList<>();
            for (String equipmentName : carDTO.getEquipment()) {
                Equipment equip = equipmentRepository.findByName(equipmentName)
                    .orElseGet(() -> {
                        Equipment newEquip = new Equipment();
                        newEquip.setName(equipmentName);
                        return equipmentRepository.save(newEquip);
                    });
                equipment.add(equip);
            }
            car.setEquipment(equipment);
            car = carRepository.save(car);
        }
        
        return convertToDTO(car);
    }

    @Transactional
    public CarDTO updateCar(Long id, CarDTO carDTO) {
        Car car = carRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("Car", id));
        updateCarFromDTO(car, carDTO);
        car = carRepository.save(car);
        return convertToDTO(car);
    }

    @Transactional
    public void deleteCar(Long id) {
        Car car = carRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("Car", id));
        // Удаляем фотографии с диска
        if (car.getPhotos() != null) {
            car.getPhotos().forEach(photo -> {
                try {
                    Files.deleteIfExists(Paths.get(photo.getUrl()));
                } catch (IOException e) {
                    // Логируем ошибку, но продолжаем удаление
                    e.printStackTrace();
                }
            });
        }
        carRepository.delete(car);
    }

    @Transactional
    public List<String> uploadPhotos(Long id, List<MultipartFile> files) {
        Car car = carRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("Car", id));

        List<String> uploadedPhotos = new ArrayList<>();
        
        for (MultipartFile file : files) {
            try {
                // Создаем директорию для фотографий если её нет
                Path uploadDir = Paths.get(uploadPath, "cars", id.toString());
                Files.createDirectories(uploadDir);

                // Генерируем уникальное имя файла
                String originalFilename = file.getOriginalFilename();
                String extension = originalFilename != null ? 
                    originalFilename.substring(originalFilename.lastIndexOf(".")) : ".jpg";
                String filename = UUID.randomUUID().toString() + extension;

                // Сохраняем файл
                Path filePath = uploadDir.resolve(filename);
                Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

                // Формируем публичный URL для доступа к изображению
                String publicUrl = "/uploads/cars/" + id + "/" + filename;

                // Создаем запись в базе
                Photo photo = new Photo();
                photo.setCar(car);
                photo.setUrl(publicUrl);

                photoRepository.save(photo);
                uploadedPhotos.add(publicUrl);

            } catch (IOException e) {
                throw new RuntimeException("Failed to store file", e);
            }
        }

        return uploadedPhotos;
    }

    @Transactional
    public void deletePhoto(Long carId, Long photoId) {
        Car car = carRepository.findById(carId)
            .orElseThrow(() -> new NotFoundException("Car", carId));

        Photo photo = photoRepository.findById(photoId)
            .orElseThrow(() -> new NotFoundException("Photo", photoId));

        // Проверяем, принадлежит ли фото этому автомобилю
        if (!photo.getCar().getId().equals(carId)) {
            throw new RuntimeException("Photo does not belong to this car");
        }

        try {
            // Удаляем файл с диска
            Files.deleteIfExists(Paths.get(photo.getUrl()));
        } catch (IOException e) {
            throw new RuntimeException("Failed to delete photo file", e);
        }

        photoRepository.delete(photo);
    }

    private void updateCarFromDTO(Car car, CarDTO dto) {
        // Обновляем базовые поля
        car.setMake(dto.getMake());
        car.setModel(dto.getModel());
        car.setYear(validateYear(dto.getYear()));
        car.setPrice(validatePrice(dto.getPrice()));
        car.setMileage(validateMileage(dto.getMileage()));

        // BodyType
        if (dto.getBodyTypeName() != null) {
            BodyType bodyType = bodyTypeRepository.findByName(dto.getBodyTypeName())
                .orElseGet(() -> {
                    BodyType newBodyType = new BodyType();
                    newBodyType.setName(dto.getBodyTypeName());
                    return bodyTypeRepository.save(newBodyType);
                });
            car.setBodyType(bodyType);
        }

        // Color с поддержкой hex-кода
        if (dto.getColorName() != null) {
            Color color = colorRepository.findByName(dto.getColorName())
                .orElseGet(() -> {
                    Color newColor = new Color();
                    newColor.setName(dto.getColorName());
                    // Устанавливаем hex-код, если он предоставлен
                    if (dto.getColorHexCode() != null && !dto.getColorHexCode().isEmpty()) {
                        newColor.setHexCode(dto.getColorHexCode());
                    }
                    return colorRepository.save(newColor);
                });
            
            // Обновляем hex-код существующего цвета, если он предоставлен
            if (dto.getColorHexCode() != null && !dto.getColorHexCode().isEmpty() && 
                (color.getHexCode() == null || !color.getHexCode().equals(dto.getColorHexCode()))) {
                color.setHexCode(dto.getColorHexCode());
                colorRepository.save(color);
            }
            
            car.setColor(color);
        }

        // Строковые поля вместо связанных сущностей
        car.setCarCondition(dto.getCondition());
        car.setLocation(dto.getLocation());
        car.setMainPhotoUrl(dto.getMainPhotoUrl());

        // SafetyFeatures
        if (dto.getSafetyFeatures() != null) {
            List<SafetyFeature> safetyFeatures = new ArrayList<>();
            for (String featureName : dto.getSafetyFeatures()) {
                SafetyFeature feature = safetyFeatureRepository.findByName(featureName)
                    .orElseGet(() -> {
                        SafetyFeature newFeature = new SafetyFeature();
                        newFeature.setName(featureName);
                        return safetyFeatureRepository.save(newFeature);
                    });
                safetyFeatures.add(feature);
            }
            car.setSafetyFeatures(safetyFeatures);
        }

        // Equipment
        if (dto.getEquipment() != null) {
            List<Equipment> equipment = new ArrayList<>();
            for (String equipmentName : dto.getEquipment()) {
                Equipment equip = equipmentRepository.findByName(equipmentName)
                    .orElseGet(() -> {
                        Equipment newEquip = new Equipment();
                        newEquip.setName(equipmentName);
                        return equipmentRepository.save(newEquip);
                    });
                equipment.add(equip);
            }
            car.setEquipment(equipment);
        }

        // TechnicalSpec
        if (dto.getTechnicalSpec() != null) {
            updateTechnicalSpec(car, dto.getTechnicalSpec());
        }
    }

    private void validateRequiredFields(CarDTO dto) {
        List<String> missingFields = new ArrayList<>();

        if (dto.getMake() == null || dto.getMake().trim().isEmpty()) {
            missingFields.add("make");
        }
        if (dto.getModel() == null || dto.getModel().trim().isEmpty()) {
            missingFields.add("model");
        }
        if (dto.getYear() == null) {
            missingFields.add("year");
        }
        if (dto.getPrice() == null) {
            missingFields.add("price");
        }
        if (dto.getMileage() == null) {
            missingFields.add("mileage");
        }

        if (!missingFields.isEmpty()) {
            throw new ValidationException("Отсутствуют обязательные поля: " + String.join(", ", missingFields));
        }
    }

    private int validateYear(Integer year) {
        int currentYear = Calendar.getInstance().get(Calendar.YEAR);
        if (year == null || year < 1900 || year > currentYear + 1) {
            throw new ValidationException(String.format("Год должен быть между 1900 и %d", currentYear + 1));
        }
        return year;
    }

    private BigDecimal validatePrice(BigDecimal price) {
        if (price == null || price.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ValidationException("Цена должна быть больше нуля");
        }
        return price;
    }

    private int validateMileage(Integer mileage) {
        if (mileage == null || mileage < 0) {
            throw new ValidationException("Пробег не может быть отрицательным");
        }
        return mileage;
    }

    private List<SafetyFeature> findSafetyFeatures(List<String> featureNames) {
        return featureNames.stream()
            .map(name -> safetyFeatureRepository.findByName(name)
                .orElseThrow(() -> new NotFoundException("SafetyFeature", name)))
            .collect(Collectors.toList());
    }

    private List<Equipment> findEquipment(List<String> equipmentNames) {
        return equipmentNames.stream()
            .map(name -> equipmentRepository.findByName(name)
                .orElseThrow(() -> new NotFoundException("Equipment", name)))
            .collect(Collectors.toList());
    }

    private void updateTechnicalSpec(Car car, TechnicalSpecDTO specDTO) {
        if (specDTO == null) {
            return;
        }
        
        try {
            TechnicalSpec spec = car.getTechnicalSpec();
            if (spec == null) {
                spec = new TechnicalSpec();
                spec.setCar(car);
            }
            
            // Обновляем все поля, которые присутствуют в DTO
            if (specDTO.getFuelType() != null) {
                spec.setFuelType(specDTO.getFuelType());
            }
            if (specDTO.getEngineVolume() != null) {
                spec.setEngineVolume(specDTO.getEngineVolume());
            }
            if (specDTO.getHorsePower() != null) {
                spec.setHorsePower(specDTO.getHorsePower());
            }
            if (specDTO.getDriveType() != null) {
                spec.setDriveType(specDTO.getDriveType());
            }
            if (specDTO.getTransmissionType() != null) {
                spec.setTransmissionType(specDTO.getTransmissionType());
            }
            if (specDTO.getGears() != null) {
                spec.setGears(specDTO.getGears());
            }
            
            // Добавляем информацию о двигателе и трансмиссии
            StringBuilder engineInfo = new StringBuilder();
            if (specDTO.getFuelType() != null) {
                engineInfo.append(specDTO.getFuelType()).append(" ");
            }
            if (specDTO.getEngineVolume() != null) {
                engineInfo.append(specDTO.getEngineVolume()).append("L ");
            }
            if (specDTO.getHorsePower() != null) {
                engineInfo.append(specDTO.getHorsePower()).append("HP");
            }
            spec.setEngineInfo(engineInfo.toString().trim());
            
            StringBuilder transmissionInfo = new StringBuilder();
            if (specDTO.getTransmissionType() != null) {
                transmissionInfo.append(specDTO.getTransmissionType());
            }
            spec.setTransmissionInfo(transmissionInfo.toString().trim());
            
            technicalSpecRepository.save(spec);
            car.setTechnicalSpec(spec);
        } catch (Exception e) {
            // Логируем ошибку, но продолжаем работу
            System.err.println("Ошибка при обновлении технических характеристик: " + e.getMessage());
        }
    }

    private CarDTO convertToDTO(Car car) {
        CarDTO dto = new CarDTO();
        dto.setId(car.getId());
        dto.setMake(car.getMake());
        dto.setModel(car.getModel());
        dto.setYear(car.getYear());
        
        // Обработка BodyType
        if (car.getBodyType() != null) {
            dto.setBodyTypeName(car.getBodyType().getName());
        }
        
        dto.setPrice(car.getPrice());
        dto.setMileage(car.getMileage());
        
        // Устанавливаем значения по умолчанию для engineInfo и transmissionInfo
        dto.setEngineInfo("Не указано");
        dto.setTransmissionInfo("Не указано");
        
        // Обработка технических характеристик и установка engineInfo и transmissionInfo
        if (car.getTechnicalSpec() != null) {
            TechnicalSpecDTO specDTO = new TechnicalSpecDTO();
            TechnicalSpec spec = car.getTechnicalSpec();
            specDTO.setFuelType(spec.getFuelType());
            specDTO.setEngineVolume(spec.getEngineVolume());
            specDTO.setHorsePower(spec.getHorsePower());
            specDTO.setDriveType(spec.getDriveType());
            specDTO.setTransmissionType(spec.getTransmissionType());
            specDTO.setGears(spec.getGears());
            specDTO.setEngineInfo(spec.getEngineInfo());
            specDTO.setTransmissionInfo(spec.getTransmissionInfo());
            dto.setTechnicalSpec(specDTO);
            
            // Используем информацию из техспеков для заполнения верхних полей CarDTO
            if (spec.getEngineInfo() != null && !spec.getEngineInfo().isEmpty()) {
                dto.setEngineInfo(spec.getEngineInfo());
            }
            
            if (spec.getTransmissionInfo() != null && !spec.getTransmissionInfo().isEmpty()) {
                dto.setTransmissionInfo(spec.getTransmissionInfo());
            }
        }
        
        // Обработка Color с поддержкой hex-кода
        if (car.getColor() != null) {
            dto.setColorName(car.getColor().getName());
            dto.setColorHexCode(car.getColor().getHexCode());
        }
        
        // Вместо связи с CarCondition, используем строковое поле
        dto.setCondition(car.getCarCondition());
        
        // Вместо связи с Location, используем строковое поле
        dto.setLocation(car.getLocation());
        
        // Фотографии
        dto.setMainPhotoUrl(car.getMainPhotoUrl());
        if (car.getPhotos() != null && !car.getPhotos().isEmpty()) {
            List<String> photoUrls = car.getPhotos().stream()
                    .map(photo -> photo != null ? photo.getUrl() : null)
                    .filter(url -> url != null)
                    .collect(Collectors.toList());
            dto.setAllPhotoUrls(photoUrls);
        } else {
            dto.setAllPhotoUrls(new ArrayList<>());
        }
        
        // SafetyFeatures
        if (car.getSafetyFeatures() != null && !car.getSafetyFeatures().isEmpty()) {
            List<String> features = car.getSafetyFeatures().stream()
                    .filter(feature -> feature != null)
                    .map(feature -> feature.getName())
                    .filter(name -> name != null)
                    .collect(Collectors.toList());
            dto.setSafetyFeatures(features);
        } else {
            dto.setSafetyFeatures(new ArrayList<>());
        }
        
        // Equipment
        if (car.getEquipment() != null && !car.getEquipment().isEmpty()) {
            List<String> equipment = car.getEquipment().stream()
                    .filter(equip -> equip != null)
                    .map(equip -> equip.getName())
                    .filter(name -> name != null)
                    .collect(Collectors.toList());
            dto.setEquipment(equipment);
        } else {
            dto.setEquipment(new ArrayList<>());
        }
        
        dto.setCreatedAt(car.getCreatedAt());
        dto.setUpdatedAt(car.getUpdatedAt());
        
        return dto;
    }
} 