package com.homestyler.mypage;

import com.homestyler.auth.RefreshTokenRepository;
import com.homestyler.auth.User;
import com.homestyler.auth.UserRepository;
import com.homestyler.common.exception.ApiException;
import com.homestyler.common.exception.ErrorCode;
import com.homestyler.common.storage.FileStorageService;
import com.homestyler.mypage.MyPageDtos.Consents;
import com.homestyler.mypage.MyPageDtos.DeleteImagesRequest;
import com.homestyler.mypage.MyPageDtos.DeleteImagesResponse;
import com.homestyler.mypage.MyPageDtos.DeleteMeRequest;
import com.homestyler.mypage.MyPageDtos.DeleteMeResponse;
import com.homestyler.mypage.MyPageDtos.ImageItem;
import com.homestyler.mypage.MyPageDtos.ImagesResponse;
import com.homestyler.mypage.MyPageDtos.ProfileResponse;
import com.homestyler.mypage.MyPageDtos.Stats;
import com.homestyler.mypage.MyPageDtos.UpdateMeRequest;
import com.homestyler.mypage.MyPageDtos.UpdateMeResponse;
import com.homestyler.recommendation.AnalysisJobRepository;
import com.homestyler.recommendation.JobStatus;
import com.homestyler.recommendation.Recommendation;
import com.homestyler.recommendation.RecommendationRepository;
import com.homestyler.share.ShareLink;
import com.homestyler.share.ShareLinkRepository;
import com.homestyler.space.Space;
import com.homestyler.space.SpacePhoto;
import com.homestyler.space.SpacePhotoRepository;
import com.homestyler.space.SpaceRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.EnumSet;
import java.util.List;
import java.util.Set;

/**
 * M5 MY/DATA — 마이페이지·원본 데이터 관리·회원 탈퇴.
 * 삭제 규약: 원본 사진·도면은 스토리지 파일까지 물리 삭제(soft delete 아님, FR-DATA-002).
 * 삭제/탈퇴 시 진행 중 분석(AI_005)·원본 포함 공유 링크(SHARE_002)를 선차단한다.
 */
@Service
@Transactional
public class MyPageService {

    private static final Logger log = LoggerFactory.getLogger(MyPageService.class);
    /** 종료 상태. 나머지(QUEUED~GENERATING_VISUAL)는 "진행 중"으로 간주해 삭제를 차단한다. */
    private static final Set<JobStatus> TERMINAL = EnumSet.of(JobStatus.COMPLETED, JobStatus.FAILED);

    private final UserRepository userRepository;
    private final SpaceRepository spaceRepository;
    private final SpacePhotoRepository photoRepository;
    private final RecommendationRepository recommendationRepository;
    private final ShareLinkRepository shareLinkRepository;
    private final AnalysisJobRepository analysisJobRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final FileStorageService fileStorage;
    private final PasswordEncoder passwordEncoder;

    public MyPageService(UserRepository userRepository, SpaceRepository spaceRepository,
                         SpacePhotoRepository photoRepository,
                         RecommendationRepository recommendationRepository,
                         ShareLinkRepository shareLinkRepository,
                         AnalysisJobRepository analysisJobRepository,
                         RefreshTokenRepository refreshTokenRepository,
                         FileStorageService fileStorage, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.spaceRepository = spaceRepository;
        this.photoRepository = photoRepository;
        this.recommendationRepository = recommendationRepository;
        this.shareLinkRepository = shareLinkRepository;
        this.analysisJobRepository = analysisJobRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.fileStorage = fileStorage;
        this.passwordEncoder = passwordEncoder;
    }

    // ---------- GET /me/profile ----------

    @Transactional(readOnly = true)
    public ProfileResponse profile(Long userId) {
        User user = requireUser(userId);
        Stats stats = new Stats(
                spaceRepository.countByUserId(userId),
                recommendationRepository.countBySavedTrueAndUserId(userId),
                photoRepository.countByUser(userId));
        Consents consents = new Consents(user.isTermsOfService(), user.isPrivacyPolicy(),
                user.isImageProcessing(), user.isMarketing());
        return new ProfileResponse(user.getId(), user.getEmail(), user.getNickname(), consents, stats);
    }

    // ---------- PATCH /me ----------

    public UpdateMeResponse updateMe(Long userId, UpdateMeRequest req) {
        User user = requireUser(userId);
        if (req.nickname() != null) {
            String nickname = req.nickname().trim();
            if (nickname.isEmpty() || nickname.length() > 20) {
                throw new ApiException(ErrorCode.VALID_001, "닉네임은 1~20자여야 합니다.");
            }
            user.setNickname(nickname);
        }
        if (req.marketing() != null) {
            user.setMarketing(req.marketing());
        }
        return new UpdateMeResponse(user.getId(), user.getNickname(), user.isMarketing());
    }

    // ---------- GET /me/images ----------

    @Transactional(readOnly = true)
    public ImagesResponse images(Long userId) {
        List<ImageItem> items = photoRepository.findAllByUser(userId).stream()
                .map(p -> new ImageItem(
                        p.getId(), p.getSpace().getId(), p.getSpace().getName(),
                        "/files/" + p.getStoredFilename(), p.isFloorPlan(), p.getCreatedAt()))
                .toList();
        return new ImagesResponse(items);
    }

    // ---------- DELETE /me/images ----------

    public DeleteImagesResponse deleteImages(Long userId, DeleteImagesRequest req) {
        if (req.keepResults() == null) {
            throw new ApiException(ErrorCode.VALID_001, "keepResults 는 필수입니다.");
        }
        boolean hasIds = req.imageIds() != null && !req.imageIds().isEmpty();
        if (!req.deleteAll() && !hasIds) {
            throw new ApiException(ErrorCode.VALID_001, "삭제 대상(imageIds 또는 deleteAll)을 지정해야 합니다.");
        }

        // 삭제 대상 사진 확정 + 소유권 검증
        List<SpacePhoto> targets;
        if (req.deleteAll()) {
            targets = photoRepository.findAllByUser(userId);
        } else {
            List<Long> ids = req.imageIds().stream().distinct().toList();
            targets = photoRepository.findByIds(ids);
            if (targets.size() != ids.size()) {
                throw new ApiException(ErrorCode.RES_001); // 존재하지 않는 imageId 포함
            }
            for (SpacePhoto p : targets) {
                if (!p.getSpace().getUserId().equals(userId)) {
                    throw new ApiException(ErrorCode.AUTH_003); // 타인 이미지
                }
            }
        }

        if (targets.isEmpty()) {
            return new DeleteImagesResponse(0, 0, 0);
        }

        List<Long> spaceIds = targets.stream().map(p -> p.getSpace().getId()).distinct().toList();

        // AI_005: 대상 공간에 진행 중 분석 존재 시 차단
        if (analysisJobRepository.existsBySpaceIdInAndStatusNotIn(spaceIds, TERMINAL)) {
            throw new ApiException(ErrorCode.AI_005);
        }

        // 대상 공간의 추천안 + 공유 링크 수집
        List<Recommendation> recs = recommendationRepository.findBySpaceIdInAndUserId(spaceIds, userId);
        List<Long> recIds = recs.stream().map(Recommendation::getId).toList();
        List<ShareLink> links = recIds.isEmpty() ? List.of()
                : shareLinkRepository.findByRecommendationIdIn(recIds);
        List<ShareLink> activeOriginalLinks = links.stream()
                .filter(l -> l.isIncludeOriginalPhotos() && !l.isRevoked())
                .toList();

        // SHARE_002 선차단: 원본 포함 활성 공유 링크가 있는데 회수 미동의면 삭제하지 않음
        if (!activeOriginalLinks.isEmpty() && !req.confirmShareRevoke()) {
            throw new ApiException(ErrorCode.SHARE_002);
        }

        // 원본 사진·도면 물리 삭제 (스토리지 파일 → DB 행)
        targets.forEach(p -> fileStorage.delete(p.getStoredFilename()));
        photoRepository.deleteAll(targets);

        int revoked;
        int deletedRecommendations;
        if (req.keepResults()) {
            // 추천 결과 유지, 원본 포함 링크만 회수
            activeOriginalLinks.forEach(ShareLink::revoke);
            revoked = activeOriginalLinks.size();
            deletedRecommendations = 0;
        } else {
            // 연결된 추천안·공유 링크까지 삭제
            revoked = activeOriginalLinks.size();
            shareLinkRepository.deleteAll(links);
            recommendationRepository.deleteAll(recs);
            deletedRecommendations = recs.size();
        }

        return new DeleteImagesResponse(targets.size(), revoked, deletedRecommendations);
    }

    // ---------- DELETE /me (회원 탈퇴) ----------

    public DeleteMeResponse deleteAccount(Long userId, DeleteMeRequest req) {
        User user = requireUser(userId);

        // 비밀번호 재확인
        if (req.password() == null || !passwordEncoder.matches(req.password(), user.getPassword())) {
            throw new ApiException(ErrorCode.AUTH_001);
        }

        // AI_005: 진행 중 분석이 있으면 탈퇴 차단(완료/취소 후)
        if (analysisJobRepository.existsByUserIdAndStatusNotIn(userId, TERMINAL)) {
            throw new ApiException(ErrorCode.AI_005);
        }

        List<Space> spaces = spaceRepository.findByUserIdOrderByIdDesc(userId);

        // 1) 사진·도면 스토리지 파일 물리 삭제 (실패해도 DB 정리는 진행 — 고아 파일 로그)
        List<SpacePhoto> photos = photoRepository.findAllByUser(userId);
        for (SpacePhoto p : photos) {
            try {
                fileStorage.delete(p.getStoredFilename());
            } catch (RuntimeException e) {
                log.warn("탈퇴 파일 삭제 실패(고아 파일 가능) userId={} file={}: {}",
                        userId, p.getStoredFilename(), e.getMessage());
            }
        }

        // 2) 공유 링크 → 추천안 → 분석잡 → refreshToken → 공간(사진 cascade) → 사용자 삭제
        List<Recommendation> recs = recommendationRepository.findByUserId(userId);
        List<Long> recIds = recs.stream().map(Recommendation::getId).toList();
        if (!recIds.isEmpty()) {
            shareLinkRepository.deleteAll(shareLinkRepository.findByRecommendationIdIn(recIds));
        }
        recommendationRepository.deleteAll(recs);
        analysisJobRepository.deleteAll(analysisJobRepository.findByUserId(userId));
        refreshTokenRepository.findByUserId(userId).ifPresent(refreshTokenRepository::delete);
        spaceRepository.deleteAll(spaces); // 사진·치수·가구 행은 cascade 로 함께 삭제
        userRepository.delete(user);

        return new DeleteMeResponse(true);
    }

    // ---------- 헬퍼 ----------

    private User requireUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(ErrorCode.RES_001));
    }
}
