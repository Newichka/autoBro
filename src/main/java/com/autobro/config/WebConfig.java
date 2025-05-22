package com.autobro.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * Конфигурация CORS и статических ресурсов для Spring приложения
 * Разрешает кросс-доменные запросы с фронтенда на бэкенд
 * и настраивает доступ к загруженным изображениям
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${app.upload.path}")
    private String uploadPath;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOrigins(
                    "http://localhost:5000", 
                    "http://localhost:3000", 
                    "http://localhost:8080",
                    "http://127.0.0.1:5000", 
                    "http://127.0.0.1:3000"
                )
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true)
                .maxAge(3600); // 1 час кэширования CORS для pre-flight запросов
    }
    
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Регистрируем путь к загруженным файлам как статический ресурс
        Path uploadDir = Paths.get(uploadPath);
        String uploadPath = uploadDir.toFile().getAbsolutePath();
        
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:" + uploadPath + "/")
                .setCachePeriod(3600) // Кэширование на 1 час
                .resourceChain(true);
    }
} 