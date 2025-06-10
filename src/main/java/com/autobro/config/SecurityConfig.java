package com.autobro.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())  // Отключаем CSRF для API
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/**").permitAll()  // Разрешаем все запросы к API
                .requestMatchers("/swagger-ui/**", "/v3/api-docs/**").permitAll()  // Разрешаем доступ к Swagger UI
                .anyRequest().authenticated()
            );
        
        return http.build();
    }
} 