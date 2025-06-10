package com.autobro.model;

import jakarta.persistence.*;
import lombok.Data;
import java.util.List;

@Data
@Entity
@Table(name = "safety_features")
public class SafetyFeature {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column
    private String description;

    @Column(name = "feature_type", nullable = false)
    private String featureType;

    @ManyToMany(mappedBy = "safetyFeatures")
    private List<Car> cars;
}

