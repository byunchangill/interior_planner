package com.homestyler.recommendation;

import com.homestyler.common.exception.ApiException;
import com.homestyler.common.exception.ErrorCode;
import com.homestyler.home.StyleType;
import com.homestyler.recommendation.RecommendationDtos.AnalyzeRequest;
import com.homestyler.recommendation.RecommendationDtos.AnalysisStatusView;
import com.homestyler.recommendation.RecommendationDtos.LifestyleDto;
import com.homestyler.space.FurnitureType;
import com.homestyler.space.Space;
import com.homestyler.space.SpaceService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 분석 잡의 DB 트랜잭션 경계. 생성/검증, 상태 전환, 완료(추천안 생성), 폴링 조회를 담당한다.
 * 워커는 각 단계마다 이 빈의 프록시 메서드를 호출 → 단계별 커밋이 폴러에게 즉시 보인다.
 */
@Service
@Transactional
public class AnalysisJobStore {

    private static final List<JobStatus> TERMINAL = List.of(JobStatus.COMPLETED, JobStatus.FAILED);

    private final AnalysisJobRepository jobRepository;
    private final RecommendationRepository recommendationRepository;
    private final SpaceService spaceService;

    public AnalysisJobStore(AnalysisJobRepository jobRepository,
                            RecommendationRepository recommendationRepository,
                            SpaceService spaceService) {
        this.jobRepository = jobRepository;
        this.recommendationRepository = recommendationRepository;
        this.spaceService = spaceService;
    }

    // ---------- 생성 + 검증 ----------

    public Long create(Long userId, AnalyzeRequest req) {
        if (req == null || req.spaceId() == null) {
            throw new ApiException(ErrorCode.VALID_003, "spaceId 는 필수입니다.");
        }
        // 소유권 (RES_001 / AUTH_003) — 단일 지점(M2 SpaceService) 재사용
        Space space = spaceService.ownedSpace(req.spaceId(), userId);

        // 공간 데이터 완료 여부: 사진 + 치수 (VALID_001)
        if (space.getPhotos().isEmpty() || space.getDimension() == null) {
            throw new ApiException(ErrorCode.VALID_001, "분석하려면 공간 사진과 치수 등록이 필요합니다.");
        }

        // 스타일 1~3개 (VALID_003)
        List<String> styleNames = req.styles();
        if (styleNames == null || styleNames.isEmpty() || styleNames.size() > 3) {
            throw new ApiException(ErrorCode.VALID_003, "스타일은 1~3개 선택해야 합니다.");
        }
        List<StyleType> styles = styleNames.stream()
                .map(s -> parseEnum(StyleType.class, s)).toList();

        BudgetRange budget = parseEnum(BudgetRange.class, req.budgetRange());

        List<FurnitureType> requiredFurniture = req.requiredFurniture() == null ? List.of()
                : req.requiredFurniture().stream().map(s -> parseEnum(FurnitureType.class, s)).toList();

        Lifestyle lifestyle = toLifestyle(req.lifestyle());

        // 동시 분석 제한 (LIMIT_001)
        if (jobRepository.existsByUserIdAndStatusNotIn(userId, TERMINAL)) {
            throw new ApiException(ErrorCode.LIMIT_001);
        }

        AnalysisJob job = new AnalysisJob(userId, req.spaceId(), styles, budget,
                req.preferredColors(), requiredFurniture, req.keepFurnitureIds(), lifestyle);
        return jobRepository.save(job).getId();
    }

    // ---------- 상태 전환 (워커가 호출) ----------

    public void advance(Long jobId, JobStatus status) {
        job(jobId).advanceTo(status);
    }

    public void fail(Long jobId, String reason) {
        job(jobId).fail(reason);
    }

    /** 완료: 선택 스타일 순서대로 추천안 행 생성 후 COMPLETED. */
    public void complete(Long jobId) {
        AnalysisJob job = job(jobId);
        List<StyleType> styles = job.getStyles();
        for (int i = 0; i < styles.size(); i++) {
            recommendationRepository.save(
                    new Recommendation(jobId, job.getUserId(), job.getSpaceId(), styles.get(i), i));
        }
        job.advanceTo(JobStatus.COMPLETED);
    }

    // ---------- 폴링 조회 ----------

    @Transactional(readOnly = true)
    public AnalysisStatusView poll(Long analysisId, Long userId) {
        AnalysisJob job = ownedJob(analysisId, userId);
        List<Long> recommendationIds = job.getStatus() == JobStatus.COMPLETED
                ? recommendationRepository.findByJobIdOrderByStyleIndexAsc(analysisId)
                        .stream().map(Recommendation::getId).toList()
                : List.of();
        String failureReason = job.getStatus() == JobStatus.FAILED ? job.getFailureReason() : null;
        return new AnalysisStatusView(job.getId(), job.getStatus().name(), job.getProgress(),
                job.getStatus().getLabel(), recommendationIds, failureReason);
    }

    // ---------- 헬퍼 ----------

    private AnalysisJob job(Long jobId) {
        return jobRepository.findById(jobId)
                .orElseThrow(() -> new ApiException(ErrorCode.RES_001));
    }

    private AnalysisJob ownedJob(Long jobId, Long userId) {
        AnalysisJob job = job(jobId);
        if (!job.getUserId().equals(userId)) {
            throw new ApiException(ErrorCode.AUTH_003);
        }
        return job;
    }

    private Lifestyle toLifestyle(LifestyleDto dto) {
        if (dto == null) {
            throw new ApiException(ErrorCode.VALID_003, "생활방식(lifestyle) 입력은 필수입니다.");
        }
        StoragePreference storage = dto.storagePreference() == null ? null
                : parseEnum(StoragePreference.class, dto.storagePreference());
        HousingType housing = dto.housingType() == null ? null
                : parseEnum(HousingType.class, dto.housingType());
        return new Lifestyle(dto.householdSize(), dto.hasChildren(), dto.hasPets(),
                dto.worksFromHome(), dto.cooksOften(), storage, housing, dto.residenceYears());
    }

    private <E extends Enum<E>> E parseEnum(Class<E> type, String value) {
        if (value == null) {
            throw new ApiException(ErrorCode.VALID_003, "필수 값이 누락되었습니다.");
        }
        try {
            return Enum.valueOf(type, value.trim());
        } catch (IllegalArgumentException e) {
            throw new ApiException(ErrorCode.VALID_003, "정의되지 않은 값입니다: " + value);
        }
    }
}
