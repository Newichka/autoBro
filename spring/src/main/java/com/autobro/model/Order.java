package com.autobro.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "orders")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Order {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "full_name", nullable = false)
    private String fullName;
    
    @Column(name = "phone", nullable = false)
    private String phone;
    
    @Column(name = "email", nullable = false)
    private String email;
    
    @Column(name = "car_id", nullable = false)
    private String carId;
    
    @Column(name = "car_make", nullable = false)
    private String carMake;
    
    @Column(name = "car_model", nullable = false)
    private String carModel;
    
    @Column(name = "car_year", nullable = false)
    private Integer carYear;
    
    @Column(name = "car_price", nullable = false)
    private BigDecimal carPrice;
    
    @Column(name = "status", nullable = false)
    private String status = "NEW";
    
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
