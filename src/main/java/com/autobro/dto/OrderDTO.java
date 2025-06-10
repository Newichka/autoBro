package com.autobro.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrderDTO {
    
    @NotBlank(message = "ФИО обязательно для заполнения")
    private String fullName;
    
    @NotBlank(message = "Номер телефона обязателен для заполнения")
    private String phone;
    
    @NotBlank(message = "Email обязателен для заполнения")
    @Email(message = "Некорректный формат email")
    private String email;
    
    @NotBlank(message = "ID автомобиля обязателен")
    private String carId;
    
    @NotBlank(message = "Марка автомобиля обязательна")
    private String carMake;
    
    @NotBlank(message = "Модель автомобиля обязательна")
    private String carModel;
    
    @NotNull(message = "Год выпуска автомобиля обязателен")
    @Positive(message = "Год выпуска должен быть положительным числом")
    private Integer carYear;
    
    @NotNull(message = "Цена автомобиля обязательна")
    @Positive(message = "Цена должна быть положительным числом")
    private BigDecimal carPrice;
}
