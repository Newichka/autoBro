package com.autobro.dto;

import lombok.Data;

@Data
public class CreateCarDTO {
    private String make;
    private String model;
    private Integer year;
    private Long bodyTypeId;
    private Long colorId;
    private String carCondition;
    private String location;
    private java.math.BigDecimal price;
    private Integer mileage;
    private String mainPhotoUrl;
    private TechnicalSpecDTO technicalSpec;
    // Можно добавить safetyFeatures, equipment и т.д. по необходимости
} 