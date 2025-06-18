package com.autobro.dto;

import lombok.Data;

@Data
public class TechnicalSpecDTO {
    private String fuelType;
    private Double engineVolume;
    private Integer horsePower;
    private String driveType;
    private String transmissionType;
    private String engineInfo;
    private String transmissionInfo;
    private Integer gears;
} 