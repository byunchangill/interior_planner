package com.homestyler.auth;

import com.homestyler.common.exception.ApiException;
import com.homestyler.common.exception.ErrorCode;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedDeque;

/**
 * 로그인 브루트포스 방어 — 이메일당 15분 창에서 5회 실패 시 AUTH_005(429).
 * ponytail: 인메모리 단일 인스턴스 한정(재기동 시 초기화). 다중 인스턴스 배포 시 Redis 카운터로 교체.
 */
@Component
public class LoginAttemptLimiter {

    private static final int MAX_FAILURES = 5;
    private static final Duration WINDOW = Duration.ofMinutes(15);

    private final Map<String, Deque<Instant>> failures = new ConcurrentHashMap<>();

    /** 차단 상태면 AUTH_005 throw. 로그인 시도 전에 호출한다. */
    public void check(String email) {
        Deque<Instant> d = failures.get(key(email));
        if (d != null && recentCount(d) >= MAX_FAILURES) {
            throw new ApiException(ErrorCode.AUTH_005);
        }
    }

    public void onFailure(String email) {
        failures.computeIfAbsent(key(email), k -> new ConcurrentLinkedDeque<>()).add(Instant.now());
    }

    public void onSuccess(String email) {
        failures.remove(key(email));
    }

    private int recentCount(Deque<Instant> d) {
        Instant cutoff = Instant.now().minus(WINDOW);
        d.removeIf(t -> t.isBefore(cutoff));
        return d.size();
    }

    private String key(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }
}
