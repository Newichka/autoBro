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
    private String bodyType;
    private Long bodyTypeId;
    private BigDecimal price;
    private Integer mileage;
    private String color;
    private Long colorId;
    private String carCondition;
    private String location;
    private String mainPhotoUrl;
    private List<String> photos;
    private List<String> safetyFeatures;
    private List<String> equipment;
    private TechnicalSpecDTO technicalSpec;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
} 