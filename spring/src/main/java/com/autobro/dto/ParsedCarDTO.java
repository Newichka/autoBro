package com.autobro.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ParsedCarDTO {
    private String make;
    private String model;
    private Integer year;
    private BigDecimal price;
    private Integer mileage;
    private String engine;
    private Integer horsePower;
    private String color;
    private String imageUrl;
    private String city;
    private String bodyType;
    private String transmission;
    private String drive;
    private String url;
}
