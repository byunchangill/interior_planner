package com.homestyler.health;

import com.homestyler.common.ApiResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

/**
 * 스캐폴딩 연동 확인용 헬스체크. 인증 불필요.
 * 응답: { "success": true, "data": { "status": "UP", "service": "homestyler-api", "timestamp": "..." } }
 */
@RestController
@RequestMapping("/api/v1")
public class HealthController {

    private static final String SERVICE_NAME = "homestyler-api";

    @GetMapping("/health")
    public ApiResponse<HealthStatus> health() {
        HealthStatus status = new HealthStatus(
                "UP",
                SERVICE_NAME,
                Instant.now().truncatedTo(ChronoUnit.SECONDS)
        );
        return ApiResponse.ok(status);
    }

    public record HealthStatus(String status, String service, Instant timestamp) {
    }
}
