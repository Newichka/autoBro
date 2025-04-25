package com.autobro.model;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Entity
@Table(name = "cars")
public class Car {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "make", columnDefinition = "varchar(255)")
    private String make;

    @Column(nullable = false)
    private String model;

    @Column(nullable = false)
    private Integer year;

    @ManyToOne
    @JoinColumn(name = "body_type_id")
    private BodyType bodyType;

    @Column(nullable = false)
    private BigDecimal price;

    @Column(nullable = false)
    private Integer mileage;

    @ManyToOne
    @JoinColumn(name = "color_id")
    private Color color;

    @Column(name = "car_condition")
    private String carCondition;

    @Column(name = "location")
    private String location;

    @Column(name = "main_photo_url")
    private String mainPhotoUrl;

    @OneToMany(mappedBy = "car", cascade = CascadeType.ALL)
    private List<Photo> photos;

    @ManyToMany
    @JoinTable(
        name = "car_safety_features",
        joinColumns = @JoinColumn(name = "car_id"),
        inverseJoinColumns = @JoinColumn(name = "feature_id")
    )
    private List<SafetyFeature> safetyFeatures;

    @ManyToMany
    @JoinTable(
        name = "car_equipment",
        joinColumns = @JoinColumn(name = "car_id"),
        inverseJoinColumns = @JoinColumn(name = "equipment_id")
    )
    private List<Equipment> equipment;

    @OneToOne(mappedBy = "car", cascade = CascadeType.ALL)
    private TechnicalSpec technicalSpec;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
} 