package com.homestyler.share;

import com.homestyler.common.exception.ApiException;
import com.homestyler.common.exception.ErrorCode;
import com.homestyler.recommendation.Recommendation;
import com.homestyler.recommendation.RecommendationDtos.BudgetPlan;
import com.homestyler.recommendation.RecommendationDtos.MaterialSpec;
import com.homestyler.recommendation.RecommendationDtos.ProductItem;
import com.homestyler.recommendation.RecommendationDtos.RecommendationDetail;
import com.homestyler.recommendation.RecommendationRepository;
import com.homestyler.recommendation.RecommendationService;
import com.homestyler.share.ShareDtos.CompareColumn;
import com.homestyler.share.ShareDtos.CompareRequest;
import com.homestyler.share.ShareDtos.CompareResult;
import com.homestyler.share.ShareDtos.CreateShareLinkRequest;
import com.homestyler.share.ShareDtos.MaterialSummary;
import com.homestyler.share.ShareDtos.PublicItem;
import com.homestyler.share.ShareDtos.PublicShareView;
import com.homestyler.share.ShareDtos.RevokeResult;
import com.homestyler.share.ShareDtos.SaveResult;
import com.homestyler.share.ShareDtos.SavedItem;
import com.homestyler.share.ShareDtos.SavedList;
import com.homestyler.share.ShareDtos.SelectResult;
import com.homestyler.share.ShareDtos.ShareLinkItem;
import com.homestyler.share.ShareDtos.ShareLinkList;
import com.homestyler.share.ShareDtos.ShareLinkResult;
import com.homestyler.share.ShareDtos.ShoppingItem;
import com.homestyler.share.ShareDtos.ShoppingList;
import com.homestyler.share.ShareDtos.SpaceSummary;
import com.homestyler.space.Space;
import com.homestyler.space.SpacePhoto;
import com.homestyler.space.SpaceService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/** M4(SAVE) — 저장·비교·공유 링크·구매목록. 콘텐츠는 M3 RecommendationService 로 재구성(신규 저장 없음). */
@Service
@Transactional
public class ShareService {

    private static final int MAX_LINKS_PER_RECOMMENDATION = 5;
    private static final SecureRandom RANDOM = new SecureRandom();

    private final RecommendationRepository recommendationRepository;
    private final ShareLinkRepository shareLinkRepository;
    private final RecommendationService recommendationService;
    private final SpaceService spaceService;

    public ShareService(RecommendationRepository recommendationRepository,
                        ShareLinkRepository shareLinkRepository,
                        RecommendationService recommendationService,
                        SpaceService spaceService) {
        this.recommendationRepository = recommendationRepository;
        this.shareLinkRepository = shareLinkRepository;
        this.recommendationService = recommendationService;
        this.spaceService = spaceService;
    }

    // ---------- 저장 ----------

    public SaveResult save(Long userId, Long recommendationId, boolean saved) {
        Recommendation rec = recommendationService.ownedRecommendation(recommendationId, userId);
        rec.setSaved(saved);
        return new SaveResult(rec.getId(), rec.isSaved());
    }

    @Transactional(readOnly = true)
    public SavedList savedList(Long userId) {
        List<SavedItem> items = recommendationRepository.findBySavedTrueAndUserIdOrderBySavedAtDesc(userId).stream()
                .map(rec -> {
                    RecommendationDetail d = recommendationService.detail(rec.getId(), userId);
                    Space space = spaceService.ownedSpace(rec.getSpaceId(), userId);
                    return new SavedItem(rec.getId(), rec.getSpaceId(), space.getName(), d.style(),
                            d.concept().title(), thumbnailUrl(d.style()), budgetTotal(d), d.fitScore().total(),
                            rec.isSelected(), rec.getSavedAt());
                })
                .toList();
        return new SavedList(items);
    }

    public SelectResult select(Long userId, Long recommendationId) {
        Recommendation rec = recommendationService.ownedRecommendation(recommendationId, userId);
        // 같은 공간의 다른 대표를 자동 해제 (단일 대표)
        recommendationRepository.findBySpaceIdAndUserIdAndSelectedTrue(rec.getSpaceId(), userId)
                .forEach(other -> other.setSelected(false));
        rec.setSelected(true);
        return new SelectResult(rec.getId(), rec.isSelected());
    }

    // ---------- 비교 ----------

    @Transactional(readOnly = true)
    public CompareResult compare(Long userId, CompareRequest req) {
        List<Long> ids = req.recommendationIds();
        if (ids == null || ids.size() < 2 || ids.size() > 3) {
            throw new ApiException(ErrorCode.VALID_003, "비교는 2~3개의 추천안이 필요합니다.");
        }
        Long firstSpaceId = null;
        boolean sameSpace = true;
        List<CompareColumn> columns = new java.util.ArrayList<>();
        for (Long id : ids) {
            Recommendation rec = recommendationService.ownedRecommendation(id, userId); // RES_001/AUTH_003
            RecommendationDetail d = recommendationService.detail(id, userId);
            if (firstSpaceId == null) {
                firstSpaceId = rec.getSpaceId();
            } else if (!firstSpaceId.equals(rec.getSpaceId())) {
                sameSpace = false;
            }
            columns.add(new CompareColumn(rec.getId(), d.style(), d.concept().title(), thumbnailUrl(d.style()),
                    budgetTotal(d), d.fitScore().total(),
                    new MaterialSummary(colorOf(d.materials().wallpaper()), colorOf(d.materials().flooring())),
                    d.concept().keywords()));
        }
        return new CompareResult(sameSpace, columns);
    }

    // ---------- 공유 링크 ----------

    public ShareLinkResult createShareLink(Long userId, Long recommendationId, CreateShareLinkRequest req) {
        recommendationService.ownedRecommendation(recommendationId, userId); // RES_001/AUTH_003
        long active = shareLinkRepository.findByRecommendationIdOrderByIdAsc(recommendationId).stream()
                .filter(l -> !l.isRevoked()).count();
        if (active >= MAX_LINKS_PER_RECOMMENDATION) {
            throw new ApiException(ErrorCode.LIMIT_002);
        }
        boolean includePhotos = req != null && Boolean.TRUE.equals(req.includeOriginalPhotos());
        Instant expiresAt = expiresAt(req == null ? null : req.expiresIn());
        ShareLink link = shareLinkRepository.save(
                new ShareLink(newToken(), recommendationId, expiresAt, includePhotos));
        return new ShareLinkResult(link.getId(), link.getToken(), "/share/" + link.getToken(),
                link.getExpiresAt(), link.isIncludeOriginalPhotos());
    }

    @Transactional(readOnly = true)
    public ShareLinkList listShareLinks(Long userId, Long recommendationId) {
        recommendationService.ownedRecommendation(recommendationId, userId); // RES_001/AUTH_003
        List<ShareLinkItem> items = shareLinkRepository.findByRecommendationIdOrderByIdAsc(recommendationId).stream()
                .map(l -> new ShareLinkItem(l.getId(), "/share/" + l.getToken(), l.getExpiresAt(),
                        l.isRevoked(), l.getCreatedAt()))
                .toList();
        return new ShareLinkList(items);
    }

    public RevokeResult revokeShareLink(Long userId, Long linkId) {
        ShareLink link = shareLinkRepository.findById(linkId)
                .orElseThrow(() -> new ApiException(ErrorCode.RES_001));
        recommendationService.ownedRecommendation(link.getRecommendationId(), userId); // AUTH_003 검증
        link.revoke();
        return new RevokeResult(link.getId(), link.isRevoked());
    }

    // ---------- 공개 웹뷰 (비인증) ----------

    @Transactional(readOnly = true)
    public PublicShareView publicView(String token) {
        ShareLink link = shareLinkRepository.findByToken(token)
                .orElseThrow(() -> new ApiException(ErrorCode.SHARE_001)); // 존재하지 않는 토큰도 410 처리(정보 은닉)
        if (link.isInactive()) {
            throw new ApiException(ErrorCode.SHARE_001);
        }
        RecommendationDetail d = recommendationService.detailForOwner(link.getRecommendationId());
        Recommendation rec = recommendationRepository.findById(link.getRecommendationId())
                .orElseThrow(() -> new ApiException(ErrorCode.SHARE_001));

        List<String> originalPhotos = List.of();
        if (link.isIncludeOriginalPhotos()) {
            Space space = spaceService.ownedSpace(rec.getSpaceId(), rec.getUserId());
            originalPhotos = space.getPhotos().stream()
                    .filter(p -> !p.isFloorPlan())
                    .map(p -> "/files/" + p.getStoredFilename())
                    .toList();
        }

        List<PublicItem> items = d.items().stream()
                .map(it -> new PublicItem(it.brand(), it.name(), it.widthMm(), it.depthMm(), it.heightMm(),
                        it.price(), it.position()))
                .toList();

        return new PublicShareView(d.style(), d.concept().title(), d.concept().description(),
                d.concept().keywords(), budgetTotal(d), d.fitScore().total(), d.materials(), items,
                afterImageUrl(d.style()), originalPhotos, d.disclaimers());
    }

    // ---------- 구매목록 ----------

    @Transactional(readOnly = true)
    public ShoppingList shoppingList(Long userId, Long recommendationId, String budgetPlanRange) {
        Recommendation rec = recommendationService.ownedRecommendation(recommendationId, userId);
        RecommendationDetail d = recommendationService.detail(recommendationId, userId);
        Space space = spaceService.ownedSpace(rec.getSpaceId(), userId);

        List<ProductItem> selected = d.items();
        long total;
        BudgetPlan plan = budgetPlanRange == null ? null : d.budgetPlans().stream()
                .filter(p -> p.range().equals(budgetPlanRange)).findFirst().orElse(null);
        if (plan != null) {
            Set<Long> ids = new HashSet<>(plan.itemIds());
            selected = selected.stream().filter(it -> ids.contains(it.itemId())).toList();
            total = plan.totalPrice();
        } else {
            total = selected.stream().mapToLong(ProductItem::price).sum();
        }

        List<ShoppingItem> items = selected.stream()
                .map(it -> new ShoppingItem(it.brand(), it.name(), it.widthMm(), it.depthMm(), it.heightMm(),
                        it.price(), it.purchaseUrl()))
                .toList();

        SpaceSummary summary = new SpaceSummary(space.getDimension().getWidthM(),
                space.getDimension().getDepthM(), space.getDimension().getHeightM());
        return new ShoppingList(summary, d.fitScore().measureBeforeBuy(), items, total);
    }

    // ---------- 헬퍼 ----------

    private long budgetTotal(RecommendationDetail d) {
        return d.items().stream().mapToLong(ProductItem::price).sum();
    }

    private String thumbnailUrl(String style) {
        return "/files/placeholder_" + style.toLowerCase() + ".png";
    }

    private String afterImageUrl(String style) {
        return "/files/placeholder_" + style.toLowerCase() + "_after.png";
    }

    private String colorOf(MaterialSpec spec) {
        return spec == null ? null : spec.color();
    }

    private Instant expiresAt(String expiresIn) {
        Instant now = Instant.now();
        if ("NONE".equals(expiresIn)) {
            return null;
        }
        if ("D7".equals(expiresIn)) {
            return now.plus(7, ChronoUnit.DAYS);
        }
        return now.plus(30, ChronoUnit.DAYS); // 기본 D30
    }

    private String newToken() {
        byte[] buf = new byte[16]; // 128bit
        RANDOM.nextBytes(buf);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(buf);
    }
}
