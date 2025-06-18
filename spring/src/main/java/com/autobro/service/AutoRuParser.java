package com.autobro.service;

import com.autobro.dto.CarDTO;
import com.autobro.dto.TechnicalSpecDTO;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.concurrent.TimeUnit;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Сервис для парсинга данных с auto.ru с использованием headless-браузера
 */
@Service
@Slf4j
public class AutoRuParser {

    @Value("${parser.auto.ru.script.path:./scripts/auto_ru_parser.js}")
    private String parserScriptPath;

    @Value("${parser.auto.ru.timeout:60000}")
    private long parserTimeout;

    /**
     * Парсит данные об автомобилях с auto.ru
     * 
     * @param url URL страницы с автомобилями на auto.ru
     * @return Список объектов с данными об автомобилях
     */
    public List<CarDTO> parseCars(String url) {
        log.info("Начинаем парсинг auto.ru: {}", url);
        List<CarDTO> cars = new ArrayList<>();
        
        try {
            // Запускаем Node.js скрипт с Playwright для парсинга
            ProcessBuilder processBuilder = new ProcessBuilder("node", parserScriptPath, url);
            processBuilder.redirectErrorStream(true);
            Process process = processBuilder.start();
            
            // Читаем вывод скрипта
            StringBuilder output = new StringBuilder();
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    output.append(line).append("\n");
                }
            }
            
            // Ждем завершения процесса с таймаутом
            boolean completed = process.waitFor(parserTimeout, TimeUnit.MILLISECONDS);
            if (!completed) {
                process.destroyForcibly();
                log.error("Парсинг auto.ru превысил таймаут: {} мс", parserTimeout);
                throw new RuntimeException("Парсинг auto.ru превысил таймаут");
            }
            
            // Проверяем код завершения
            int exitCode = process.exitValue();
            if (exitCode != 0) {
                log.error("Ошибка при парсинге auto.ru. Код выхода: {}, Вывод: {}", exitCode, output);
                throw new RuntimeException("Ошибка при парсинге auto.ru: " + output);
            }
            
            // Парсим JSON-результат
            ObjectMapper mapper = new ObjectMapper();
            cars = Arrays.asList(mapper.readValue(output.toString(), CarDTO[].class));
            log.info("Успешно получено {} автомобилей с auto.ru", cars.size());
            
        } catch (IOException | InterruptedException e) {
            log.error("Ошибка при парсинге auto.ru", e);
            throw new RuntimeException("Ошибка при парсинге auto.ru: " + e.getMessage(), e);
        }
        
        return cars;
    }
    
    /**
     * Парсит детальную информацию об автомобиле по URL
     * 
     * @param detailUrl URL страницы с детальной информацией об автомобиле
     * @return Объект с данными об автомобиле
     */
    public CarDTO parseCarDetails(String detailUrl) {
        log.info("Парсинг детальной информации об автомобиле: {}", detailUrl);
        
        try {
            // Запускаем Node.js скрипт с Playwright для парсинга деталей
            ProcessBuilder processBuilder = new ProcessBuilder("node", parserScriptPath, detailUrl, "--details");
            processBuilder.redirectErrorStream(true);
            Process process = processBuilder.start();
            
            // Читаем вывод скрипта
            StringBuilder output = new StringBuilder();
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    output.append(line).append("\n");
                }
            }
            
            // Ждем завершения процесса с таймаутом
            boolean completed = process.waitFor(parserTimeout, TimeUnit.MILLISECONDS);
            if (!completed) {
                process.destroyForcibly();
                log.error("Парсинг деталей auto.ru превысил таймаут: {} мс", parserTimeout);
                throw new RuntimeException("Парсинг деталей auto.ru превысил таймаут");
            }
            
            // Проверяем код завершения
            int exitCode = process.exitValue();
            if (exitCode != 0) {
                log.error("Ошибка при парсинге деталей auto.ru. Код выхода: {}, Вывод: {}", exitCode, output);
                throw new RuntimeException("Ошибка при парсинге деталей auto.ru: " + output);
            }
            
            // Парсим JSON-результат
            ObjectMapper mapper = new ObjectMapper();
            CarDTO car = mapper.readValue(output.toString(), CarDTO.class);
            log.info("Успешно получены детали автомобиля: {} {}", car.getMake(), car.getModel());
            
            return car;
            
        } catch (IOException | InterruptedException e) {
            log.error("Ошибка при парсинге деталей auto.ru", e);
            throw new RuntimeException("Ошибка при парсинге деталей auto.ru: " + e.getMessage(), e);
        }
    }
    
    /**
     * Извлекает технические характеристики из текстового описания
     * 
     * @param description Текстовое описание автомобиля
     * @return Объект с техническими характеристиками
     */
    private TechnicalSpecDTO extractTechnicalSpec(String description) {
        TechnicalSpecDTO spec = new TechnicalSpecDTO();
        
        // Извлекаем объем двигателя
        Pattern engineVolumePattern = Pattern.compile("(\\d+[.,]\\d+)\\s*л");
        Matcher engineVolumeMatcher = engineVolumePattern.matcher(description);
        if (engineVolumeMatcher.find()) {
            String volumeStr = engineVolumeMatcher.group(1).replace(',', '.');
            spec.setEngineVolume(Double.parseDouble(volumeStr));
        }
        
        // Извлекаем мощность двигателя
        Pattern horsePowerPattern = Pattern.compile("(\\d+)\\s*л\\.?с\\.?");
        Matcher horsePowerMatcher = horsePowerPattern.matcher(description);
        if (horsePowerMatcher.find()) {
            spec.setHorsePower(Integer.parseInt(horsePowerMatcher.group(1)));
        }
        
        // Определяем тип топлива
        if (description.toLowerCase().contains("бензин")) {
            spec.setFuelType("Бензин");
        } else if (description.toLowerCase().contains("дизель")) {
            spec.setFuelType("Дизель");
        } else if (description.toLowerCase().contains("электро")) {
            spec.setFuelType("Электро");
        } else if (description.toLowerCase().contains("гибрид")) {
            spec.setFuelType("Гибрид");
        }
        
        // Определяем тип трансмиссии
        if (description.toLowerCase().contains("механика") || description.toLowerCase().contains("мкпп")) {
            spec.setTransmissionType("Механика");
        } else if (description.toLowerCase().contains("автомат") || description.toLowerCase().contains("акпп")) {
            spec.setTransmissionType("Автомат");
        } else if (description.toLowerCase().contains("робот")) {
            spec.setTransmissionType("Робот");
        } else if (description.toLowerCase().contains("вариатор") || description.toLowerCase().contains("cvt")) {
            spec.setTransmissionType("Вариатор");
        }
        
        // Определяем тип привода
        if (description.toLowerCase().contains("передний привод") || description.toLowerCase().contains("fwd")) {
            spec.setDriveType("Передний");
        } else if (description.toLowerCase().contains("задний привод") || description.toLowerCase().contains("rwd")) {
            spec.setDriveType("Задний");
        } else if (description.toLowerCase().contains("полный привод") || 
                  description.toLowerCase().contains("4wd") || 
                  description.toLowerCase().contains("awd")) {
            spec.setDriveType("Полный");
        }
        
        return spec;
    }
}
