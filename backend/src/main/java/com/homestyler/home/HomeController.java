package com.homestyler.home;

import com.homestyler.auth.UserRepository;
import com.homestyler.common.ApiResponse;
import com.homestyler.common.exception.ApiException;
import com.homestyler.common.exception.ErrorCode;
import com.homestyler.home.HomeDtos.HomeSummary;
import com.homestyler.home.HomeDtos.StyleHighlight;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Arrays;
import java.util.List;

@RestController
@RequestMapping("/api/v1/home")
public class HomeController {

    private final UserRepository userRepository;

    public HomeController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping("/summary")
    public ApiResponse<HomeSummary> summary(@AuthenticationPrincipal Long userId) {
        String nickname = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(ErrorCode.AUTH_001))
                .getNickname();
        // SPACE 모듈 미구현 → recentSpaces 는 항상 빈 배열 (계약 명시)
        List<StyleHighlight> highlights = Arrays.stream(StyleType.values())
                .map(s -> new StyleHighlight(s.name(), s.getTitle(), s.thumbnailUrl()))
                .toList();
        return ApiResponse.ok(new HomeSummary(nickname, List.of(), highlights));
    }
}
