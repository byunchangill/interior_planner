package com.homestyler.recommendation;

import com.homestyler.home.StyleType;
import com.homestyler.recommendation.RecommendationDtos.BudgetPlan;
import com.homestyler.recommendation.RecommendationDtos.Concept;
import com.homestyler.recommendation.RecommendationDtos.KeepFurnitureLayout;
import com.homestyler.recommendation.RecommendationDtos.LayoutSection;
import com.homestyler.recommendation.RecommendationDtos.MaterialSpec;
import com.homestyler.recommendation.RecommendationDtos.Materials;
import com.homestyler.recommendation.RecommendationDtos.ProductItem;
import com.homestyler.space.FurnitureType;
import com.homestyler.space.SpaceType;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

/**
 * Mock 추천 생성. 스타일·공간유형·생활방식을 반영한 그럴듯한 8섹션 데이터를 결정적으로 만든다.
 * 생활방식(반려동물·아이·재택·수납선호·주거형태)이 items/materials/storage 의 reason 에 반영되어
 * "설문이 결과에 반영됨"을 보인다. items 스키마는 실제 판매 제품형(BL-001) — 값만 Mock.
 */
@Service
public class MockAiAnalysisService implements AiAnalysisService {

    @Override
    public Draft generate(StyleType style, GenerationContext ctx) {
        Lifestyle life = ctx.lifestyle();
        List<ProductItem> items = buildItems(style, ctx, life);

        Concept concept = new Concept(
                conceptTitle(style, ctx.spaceType()),
                style.getDescription() + " 공간으로 재구성했습니다.",
                style.getKeywords());

        LayoutSection layout = new LayoutSection(
                placeholder(style, "layout"),
                "출입 동선을 벽면으로 붙이고 중앙을 비워 이동을 편하게 했습니다.",
                life.hasPets()
                        ? "반려동물 이동 반경을 고려해 통로를 넓게 확보했습니다."
                        : "창문 앞을 비워 채광과 개방감을 유지합니다.");

        Materials materials = buildMaterials(style, ctx, life);

        List<String> spaceTips = new ArrayList<>(List.of("낮은 가구로 시야를 틔워 개방감을 확보하세요."));
        if (life.hasChildren()) {
            spaceTips.add("모서리 보호대와 미끄럼 방지 러그로 안전을 보강하세요.");
        }

        List<String> storage = new ArrayList<>();
        if (life.prefersStorage()) {
            storage.add("벽면 전체를 활용한 대용량 수납장을 배치하세요.");
            storage.add("침구·계절용품은 상부장에 분리 수납하세요.");
        } else {
            storage.add("최소한의 수납만 두어 여백과 개방감을 살리세요.");
        }

        KeepFurnitureLayout keep = buildKeep(ctx.keepFurniture());

        List<BudgetPlan> budgetPlans = buildBudgetPlans(items);

        List<String> disclaimers = List.of(
                "본 추천은 AI 분석 결과로 실제 치수·시공 가능 여부와 다를 수 있습니다.");

        return new Draft(concept, layout, materials, spaceTips, storage, keep, budgetPlans, items, disclaimers);
    }

    // ---------- items ----------

    private List<ProductItem> buildItems(StyleType style, GenerationContext ctx, Lifestyle life) {
        long base = ctx.recommendationId() * 100;
        List<ProductItem> items = new ArrayList<>();

        // 1) 주력 가구 (공간 유형별)
        items.add(primaryItem(base + 1, style, ctx.spaceType(), life));

        // 2) 수납 가구 (수납 선호 + 주거형태 반영)
        boolean builtIn = life.prefersStorage() && life.getHousingType() == HousingType.OWNED;
        items.add(new ProductItem(base + 2, "B사",
                life.prefersStorage() ? "대용량 4문 옷장" : "슬림 2단 서랍장", FurnitureType.WARDROBE.name(),
                life.prefersStorage() ? 2000 : 1000, 600, 2000,
                life.prefersStorage() ? 1180000 : 420000,
                "https://example.com/p/" + (base + 2), "북측 벽",
                life.prefersStorage()
                        ? "수납 선호 — 계절 의류까지 담는 대용량 구성" + (builtIn ? " (붙박이 시공)" : "")
                        : "개방감 선호 — 최소 수납으로 여백 확보",
                builtIn));

        // 3) 재택근무 시 작업 책상, 아니면 스타일 포인트 가구
        if (life.worksFromHome()) {
            items.add(new ProductItem(base + 3, "C사", "1400 원목 책상", FurnitureType.TABLE.name(),
                    1400, 700, 750, 690000,
                    "https://example.com/p/" + (base + 3), "창측 벽",
                    "재택근무 — 채광 좋은 창측에 넓은 작업 공간 확보", false));
        } else {
            items.add(new ProductItem(base + 3, "C사", style.getTitle() + " 액센트 체어",
                    FurnitureType.CHAIR.name(), 700, 700, 900, 390000,
                    "https://example.com/p/" + (base + 3), "코너",
                    style.getKeywords().get(0) + " 무드를 살리는 포인트 가구", false));
        }
        return items;
    }

    private ProductItem primaryItem(long id, StyleType style, SpaceType spaceType, Lifestyle life) {
        String url = "https://example.com/p/" + id;
        return switch (spaceType) {
            case BEDROOM -> new ProductItem(id, "A사", "퀸 프레임 침대", FurnitureType.BED.name(),
                    1500, 2100, 1100, 1090000, url, "안측 벽 중앙",
                    life.hasChildren() ? "아이 안전 — 낮고 모서리가 둥근 저상형 프레임"
                            : "숙면을 위한 안정적인 저상형 디자인", false);
            case KITCHEN -> new ProductItem(id, "A사", "4인 원목 식탁", FurnitureType.TABLE.name(),
                    1400, 800, 750, 790000, url, "주방 창측",
                    life.cooksOften() ? "요리 자주 — 넓은 상판과 관리 쉬운 마감"
                            : "4인 가족 식사에 적합한 크기", false);
            case STUDY -> new ProductItem(id, "A사", "1600 스탠딩 데스크", FurnitureType.TABLE.name(),
                    1600, 700, 750, 890000, url, "창측 벽",
                    "장시간 작업을 위한 높이 조절 데스크", false);
            default -> new ProductItem(id, "A사", "3인용 패브릭 소파", FurnitureType.SOFA.name(),
                    2180, 920, 810, 1290000, url, "거실 남측 벽",
                    life.hasPets() ? "반려동물 가정 — 긁힘에 강한 고밀도 패브릭"
                            : life.hasChildren() ? "아이 안전 — 오염에 강하고 모서리가 둥근 디자인"
                            : style.getKeywords().get(0) + " 톤에 어울리는 로우 소파", false);
        };
    }

    private List<BudgetPlan> buildBudgetPlans(List<ProductItem> items) {
        long p1 = items.get(0).price();
        long p2 = p1 + items.get(1).price();
        long p3 = p2 + items.get(2).price();
        return List.of(
                new BudgetPlan(BudgetRange.R100_300.name(), "최소 변경안", p1,
                        List.of(items.get(0).itemId())),
                new BudgetPlan(BudgetRange.R300_500.name(), "균형형", p2,
                        List.of(items.get(0).itemId(), items.get(1).itemId())),
                new BudgetPlan(BudgetRange.R500_1000.name(), "전체 변경안", p3,
                        List.of(items.get(0).itemId(), items.get(1).itemId(), items.get(2).itemId())));
    }

    // ---------- materials ----------

    private Materials buildMaterials(StyleType style, GenerationContext ctx, Lifestyle life) {
        String wallColor = ctx.preferredColors() != null && !ctx.preferredColors().isEmpty()
                ? ctx.preferredColors().get(0) : "#F5F0E8";
        String wallReason = ctx.preferredColors() != null && !ctx.preferredColors().isEmpty()
                ? "선호 색상 " + wallColor + " 을(를) 벽면 기조색으로 반영"
                : style.getKeywords().get(0) + " 톤의 기본 벽지";

        MaterialSpec wallpaper = MaterialSpec.of(wallColor, "실크 벽지", wallReason);
        MaterialSpec flooring = MaterialSpec.of("#C9A227", "오크 강마루",
                life.hasPets() ? "반려동물 — 스크래치·습기에 강한 강마루" : "따뜻한 우드톤 바닥");
        // 조명 시공은 전문가 확인 필요(RECO-008)
        MaterialSpec lighting = new MaterialSpec("#FFF3E0", "따뜻한 간접조명",
                "은은한 확산광으로 아늑함을 더합니다.", true);
        MaterialSpec curtain = MaterialSpec.of("#FFFFFF", "리넨 커튼",
                life.worksFromHome() ? "재택 — 눈부심을 줄이는 반투과 리넨" : "채광을 부드럽게 거르는 리넨");
        return new Materials(wallpaper, flooring, lighting, curtain);
    }

    // ---------- keep ----------

    private KeepFurnitureLayout buildKeep(List<KeepRef> keep) {
        if (keep == null || keep.isEmpty()) {
            return null; // 유지 가구 없으면 null (FE 섹션 숨김)
        }
        String labels = keep.stream().map(KeepRef::label).reduce((a, b) -> a + ", " + b).orElse("");
        List<Long> ids = keep.stream().map(KeepRef::id).toList();
        return new KeepFurnitureLayout("기존 " + labels + "을(를) 벽면에 유지하도록 배치했습니다.", ids);
    }

    // ---------- helpers ----------

    private String conceptTitle(StyleType style, SpaceType spaceType) {
        return style.getKeywords().get(0) + " " + style.getTitle().replace(" 스타일", "") + " " + spaceType.korName();
    }

    private String placeholder(StyleType style, String kind) {
        return "/files/placeholder_" + style.name().toLowerCase() + "_" + kind + ".png";
    }
}
