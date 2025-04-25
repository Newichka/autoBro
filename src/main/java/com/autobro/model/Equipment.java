package com.autobro.model;

import com.autobro.model.enums.EquipmentCategory;
import jakarta.persistence.*;
import lombok.Data;
import java.util.List;

@Data
@Entity
@Table(name = "equipment")
public class Equipment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false)
    private EquipmentCategory category;

    @Column(name = "is_standard")
    private Boolean isStandard;

    @ManyToMany(mappedBy = "equipment")
    private List<Car> cars;
}

