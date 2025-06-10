package com.autobro.model;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "car_photos")
public class Photo {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "car_id", nullable = false)
    private Car car;

    @Column(name = "url", nullable = false)
    private String url;

    @Column(name = "main_photo", nullable = false)
    private Boolean mainPhoto = false;

    // Метод для получения URL фотографии
    public String getUrl() {
        return this.url;
    }
} 