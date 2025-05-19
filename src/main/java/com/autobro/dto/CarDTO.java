package com.autobro.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class CarDTO {
    private Long id;
    private String make;
    private String model;
    private Integer year;
    private String bodyTypeName;
    private BigDecimal price;
    private Integer mileage;
    private String engineInfo;
    private String transmissionInfo;
    private String colorName;
    private String colorHexCode; // Добавлено поле для hex-кода цвета
    private String condition;
    private String location;
    private String mainPhotoUrl;
    private List<String> allPhotoUrls;
    private List<String> safetyFeatures;
    private List<String> equipment;
    private TechnicalSpecDTO technicalSpec;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
} 