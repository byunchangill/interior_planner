package com.homestyler.common.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

/**
 * 보안 설정 (M1: 실제 JWT 인증 도입).
 * - CSRF off, CORS: FE dev origin(http://localhost:*, prod에서 실도메인으로 교체)
 * - STATELESS 세션, JwtAuthenticationFilter 로 Bearer 토큰 검증
 * - permitAll: /api/v1/health, /api/v1/auth(signup·login·refresh), /api/v1/styles/**, /files/** (+ dev H2 콘솔)
 *   /files 는 필터 단계만 통과 — 실제 인가는 FileController 의 HMAC 서명 검증이 담당한다.
 * - 나머지(/home/summary, /auth/me, /auth/consents 등)는 인증 필요
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private static final String[] PUBLIC_ENDPOINTS = {
            "/api/v1/health",
            "/api/v1/auth/signup",
            "/api/v1/auth/login",
            "/api/v1/auth/refresh",
            "/api/v1/auth/kakao",
            "/api/v1/auth/google",
            "/api/v1/styles",
            "/api/v1/styles/**",
            "/api/v1/share/**", // M4: 공개 공유 웹뷰 (비인증)
            "/files/**"
    };

    private final JwtProvider jwtProvider;
    private final JwtAuthenticationEntryPoint entryPoint;
    private final List<String> allowedOrigins;

    public SecurityConfig(JwtProvider jwtProvider, JwtAuthenticationEntryPoint entryPoint,
                          @org.springframework.beans.factory.annotation.Value("${app.cors.allowed-origins}") String allowedOrigins) {
        this.jwtProvider = jwtProvider;
        this.entryPoint = entryPoint;
        this.allowedOrigins = List.of(allowedOrigins.split("\\s*,\\s*"));
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .headers(headers -> headers.frameOptions(frame -> frame.sameOrigin())) // H2 콘솔용
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(PUBLIC_ENDPOINTS).permitAll()
                        .requestMatchers("/h2-console/**").permitAll()
                        .anyRequest().authenticated()
                )
                .exceptionHandling(ex -> ex.authenticationEntryPoint(entryPoint))
                .addFilterBefore(new JwtAuthenticationFilter(jwtProvider),
                        UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        // 허용 오리진은 app.cors.allowed-origins(프로퍼티)에서 주입. 로컬 기본 localhost:*, prod 는 실도메인.
        config.setAllowedOriginPatterns(allowedOrigins);
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
