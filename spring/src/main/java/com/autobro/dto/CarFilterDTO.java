package com.autobro.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class CarFilterDTO {
    private List<String> make;
    private String model;
    private Integer minYear;
    private Integer maxYear;
    private BigDecimal minPrice;
    private BigDecimal maxPrice;
    private Integer maxMileage;
    private Long bodyTypeId;
    private String fuelType;
    private Integer minHorsePower;
    private String transmissionType;
    private String driveType;
    private Long colorId;
    private String country;
    private String city;
    private Integer page;
    private Integer size;
    private String sortBy;
    private String sortDirection;
} 