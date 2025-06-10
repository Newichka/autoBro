package com.autobro.model;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "car_tech_specs")
public class TechnicalSpec {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "car_id", nullable = false)
    private Car car;

    @Column(name = "fuel_type")
    private String fuelType;

    @Column(name = "engine_volume")
    private Double engineVolume;

    @Column(name = "horse_power")
    private Integer horsePower;

    @Column(name = "drive_type")
    private String driveType;

    @Column(name = "transmission_type")
    private String transmissionType;

    @Column(name = "engine_info")
    private String engineInfo;

    @Column(name = "transmission_info")
    private String transmissionInfo;

    @Column(name = "gears")
    private Integer gears;
} 