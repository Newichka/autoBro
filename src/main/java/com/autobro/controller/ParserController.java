package com.autobro.controller;

import com.autobro.dto.ApiResponse;
import com.autobro.dto.CarDTO;
import com.autobro.service.AutoRuParser;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/parser")
@RequiredArgsConstructor
@Tag(name = "Parser", description = "API для парсинга данных с auto.ru")
@CrossOrigin(origins = {"http://localhost:5000", "http://localhost:3000", "http://localhost:8080", 
                        "http://127.0.0.1:5000", "http://127.0.0.1:3000"})
public class ParserController {

    private final AutoRuParser autoRuParser;

    @GetMapping("/auto-ru")
    @Operation(summary = "Парсинг списка автомобилей с auto.ru")
    public ResponseEntity<ApiResponse<List<CarDTO>>> parseAutoRu(
            @Parameter(description = "URL страницы с автомобилями на auto.ru") 
            @RequestParam String url) {
        List<CarDTO> cars = autoRuParser.parseCars(url);
        return ResponseEntity.ok(ApiResponse.success(cars, "Данные успешно получены с auto.ru"));
    }

    @GetMapping("/auto-ru/details")
    @Operation(summary = "Парсинг детальной информации об автомобиле с auto.ru")
    public ResponseEntity<ApiResponse<CarDTO>> parseAutoRuDetails(
            @Parameter(description = "URL страницы с детальной информацией об автомобиле на auto.ru") 
            @RequestParam String url) {
        CarDTO car = autoRuParser.parseCarDetails(url);
        return ResponseEntity.ok(ApiResponse.success(car, "Детальная информация успешно получена с auto.ru"));
    }
}
