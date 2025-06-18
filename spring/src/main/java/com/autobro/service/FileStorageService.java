package com.autobro.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;
import java.util.Arrays;
import java.util.List;
import java.util.Collections;

@Service
public class FileStorageService {
    private final Path fileStorageLocation;
    private final List<String> allowedTypes;

    public FileStorageService(
            @Value("${app.upload.path}") String uploadPath,
            @Value("${app.upload.allowed-types:}") String allowedTypesStr) {
        this.fileStorageLocation = Paths.get(uploadPath).toAbsolutePath().normalize();
        if (allowedTypesStr != null && !allowedTypesStr.isBlank()) {
            this.allowedTypes = Arrays.asList(allowedTypesStr.split("\\s*,\\s*"));
        } else {
            this.allowedTypes = Collections.emptyList();
        }
        try {
            Files.createDirectories(this.fileStorageLocation);
        } catch (IOException ex) {
            throw new RuntimeException("Could not create the directory where the uploaded files will be stored.", ex);
        }
    }

    public String storeFile(MultipartFile file, Long carId) {
        try {
            // Проверяем тип файла
            String contentType = file.getContentType();
            if (!allowedTypes.contains(contentType)) {
                throw new RuntimeException("File type not allowed. Allowed types: " + allowedTypes);
            }

            // Создаем директорию для конкретного авто
            Path carDir = this.fileStorageLocation.resolve("cars").resolve(carId.toString());
            Files.createDirectories(carDir);

            // Генерируем уникальное имя файла
            String originalFilename = file.getOriginalFilename();
            String extension = originalFilename != null ? 
                originalFilename.substring(originalFilename.lastIndexOf(".")) : ".jpg";
            String filename = UUID.randomUUID().toString() + extension;

            // Сохраняем файл
            Path targetLocation = carDir.resolve(filename);
            Files.copy(file.getInputStream(), targetLocation);

            // Возвращаем путь относительно корня uploads
            return "/uploads/cars/" + carId + "/" + filename;
        } catch (IOException ex) {
            throw new RuntimeException("Could not store file. Please try again!", ex);
        }
    }
} 