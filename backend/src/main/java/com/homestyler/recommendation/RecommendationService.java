package com.homestyler.recommendation;

import com.homestyler.common.exception.ApiException;
import com.homestyler.common.exception.ErrorCode;
import com.homestyler.recommendation.AiAnalysisService.Draft;
import com.homestyler.recommendation.AiAnalysisService.GenerationContext;
import com.homestyler.recommendation.AiAnalysisService.KeepRef;
import com.homestyler.recommendation.FitScoreCalculator.ItemDim;
import com.homestyler.recommendation.RecommendationDtos.FitScore;
import com.homestyler.recommendation.RecommendationDtos.ProductItem;
import com.homestyler.recommendation.RecommendationDtos.RecommendationDetail;
import com.homestyler.recommendation.RecommendationDtos.RegenResult;
import com.homestyler.recommendation.RecommendationDtos.VisualPair;
import com.homestyler.recommendation.RecommendationDtos.Visuals;
import com.homestyler.common.storage.FileUrlSigner;
import com.homestyler.space.Furniture;
import com.homestyler.space.Space;
import com.homestyler.space.SpacePhoto;
import com.homestyler.space.SpaceService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

/**
 * 추천 상세·시각화 조회. 저장된 잡 조건 + 공간 데이터로 콘텐츠를 결정적으로 재생성한다.
 * fitScore 만 실제 산술(FitScoreCalculator), 나머지 8섹션은 AiAnalysisService(Mock).
 */
@Service
@Transactional(readOnly = true)
public class RecommendationService {

    private final RecommendationRepository recommendationRepository;
    private final AnalysisJobRepository jobRepository;
    private final SpaceService spaceService;
    private final AiAnalysisService ai;
    private final FitScoreCalculator fitScore;
    private final FileUrlSigner fileUrlSigner;

    public RecommendationService(RecommendationRepository recommendationRepository,
                                 AnalysisJobRepository jobRepository, SpaceService spaceService,
                                 AiAnalysisService ai, FitScoreCalculator fitScore,
                                 FileUrlSigner fileUrlSigner) {
        this.recommendationRepository = recommendationRepository;
        this.jobRepository = jobRepository;
        this.spaceService = spaceService;
        this.ai = ai;
        this.fitScore = fitScore;
        this.fileUrlSigner = fileUrlSigner;
    }

    /** 공개 공유 뷰용 — 소유권 검증 없이 추천안 소유자 기준으로 상세를 재구성한다. */
    public RecommendationDetail detailForOwner(Long recommendationId) {
        Recommendation rec = recommendationRepository.findById(recommendationId)
                .orElseThrow(() -> new ApiException(ErrorCode.RES_001));
        return detail(recommendationId, rec.getUserId());
    }

    public RecommendationDetail detail(Long recommendationId, Long userId) {
        Recommendation rec = ownedRecommendation(recommendationId, userId);
        AnalysisJob job = jobRepository.findById(rec.getJobId())
                .orElseThrow(() -> new ApiException(ErrorCode.RES_001));
        Space space = spaceService.ownedSpace(rec.getSpaceId(), userId);

        List<KeepRef> keepRefs = keepRefs(job.getKeepFurnitureIds(), space.getFurniture());
        GenerationContext ctx = new GenerationContext(rec.getId(), space.getSpaceType(),
                job.getBudgetRange(), job.getPreferredColors(), job.getRequiredFurniture(),
                keepRefs, job.getLifestyle());

        Draft draft = ai.generate(rec.getStyle(), ctx);
        FitScore fit = fitScore.compute(
                space.getDimension().getWidthM(), space.getDimension().getDepthM(),
                toItemDims(draft.items()));

        return new RecommendationDetail(rec.getId(), rec.getJobId(), rec.getSpaceId(), rec.getStyle().name(),
                draft.concept(), draft.layout(), draft.materials(), draft.spaceTips(), draft.storage(),
                draft.keepFurnitureLayout(), draft.budgetPlans(), draft.items(), fit, draft.disclaimers());
    }

    public Visuals visuals(Long recommendationId, Long userId) {
        Recommendation rec = ownedRecommendation(recommendationId, userId);
        Space space = spaceService.ownedSpace(rec.getSpaceId(), userId);
        // After(AI 생성 시각화)는 v1엔 없음 → null. FE가 "AI 시각화 준비 중" placeholder를 렌더한다.
        String afterUrl = null;

        List<SpacePhoto> photos = space.getPhotos().stream().filter(p -> !p.isFloorPlan()).toList();
        List<VisualPair> pairs = new ArrayList<>();
        if (photos.isEmpty()) {
            // 원본 사진 없음/삭제 → After 단독(부분 성공)
            pairs.add(new VisualPair(null, afterUrl, space.getName()));
            return new Visuals(pairs, true);
        }
        for (int i = 0; i < photos.size(); i++) {
            pairs.add(new VisualPair(fileUrlSigner.sign(photos.get(i).getStoredFilename()), afterUrl,
                    space.getName() + " 뷰 " + (i + 1)));
        }
        return new Visuals(pairs, null);
    }

    public RegenResult regenerate(Long recommendationId, Long userId) {
        ownedRecommendation(recommendationId, userId); // 소유권 검증만, 스텁
        return new RegenResult(JobStatus.QUEUED.name());
    }

    // ---------- 헬퍼 ----------

    public Recommendation ownedRecommendation(Long recommendationId, Long userId) {
        Recommendation rec = recommendationRepository.findById(recommendationId)
                .orElseThrow(() -> new ApiException(ErrorCode.RES_001));
        if (!rec.getUserId().equals(userId)) {
            throw new ApiException(ErrorCode.AUTH_003);
        }
        return rec;
    }

    private List<KeepRef> keepRefs(List<Long> keepIds, List<Furniture> furniture) {
        if (keepIds == null || keepIds.isEmpty()) {
            return List.of();
        }
        return furniture.stream()
                .filter(f -> keepIds.contains(f.getId()))
                .map(f -> new KeepRef(f.getId(), f.getLabel()))
                .toList();
    }

    private List<ItemDim> toItemDims(List<ProductItem> items) {
        return items.stream()
                .map(it -> ItemDim.fromMm(it.name(), it.widthMm(), it.depthMm()))
                .toList();
    }
}
