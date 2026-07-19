package com.homestyler.common.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

/**
 * M0 스캐폴딩 보안 설정.
 * - CSRF off (SPA + 토큰 기반 인증 예정)
 * - CORS: FE dev origin(http://localhost:5173) 허용
 * - permitAll: /api/v1/health, /api/v1/auth/**, /files/** (+ dev H2 콘솔)
 * - 나머지는 인증 필요 (M0 에서는 실제 인증 필터 없이 스텁)
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private static final String[] PUBLIC_ENDPOINTS = {
            "/api/v1/health",
            "/api/v1/auth/**",
            "/files/**"
    };

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(Customizer.withDefaults())
                .headers(headers -> headers.frameOptions(frame -> frame.sameOrigin())) // H2 콘솔용
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(PUBLIC_ENDPOINTS).permitAll()
                        .requestMatchers("/h2-console/**").permitAll()
                        .anyRequest().authenticated()
                );
        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of("http://localhost:5173"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
