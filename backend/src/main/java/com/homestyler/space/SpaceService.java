package com.homestyler.space;

import com.homestyler.common.exception.ApiException;
import com.homestyler.common.exception.ErrorCode;
import com.homestyler.common.storage.FileStorageService;
import com.homestyler.space.AiEstimationService.Estimation;
import com.homestyler.space.SpaceDtos.CreateSpaceRequest;
import com.homestyler.space.SpaceDtos.DetectedFurnitureDto;
import com.homestyler.space.SpaceDtos.DimensionDto;
import com.homestyler.space.SpaceDtos.DimensionResult;
import com.homestyler.space.SpaceDtos.DimensionUpdateRequest;
import com.homestyler.space.SpaceDtos.FurnitureDto;
import com.homestyler.space.SpaceDtos.FurnitureItemRequest;
import com.homestyler.space.SpaceDtos.FurnitureListResult;
import com.homestyler.space.SpaceDtos.FurniturePutRequest;
import com.homestyler.space.SpaceDtos.OpeningDto;
import com.homestyler.space.SpaceDtos.OpeningRequest;
import com.homestyler.space.SpaceDtos.PhotoDto;
import com.homestyler.space.SpaceDtos.PhotoUploadResult;
import com.homestyler.space.SpaceDtos.SpaceCreated;
import com.homestyler.space.SpaceDtos.SpaceDetail;
import com.homestyler.space.SpaceDtos.SpaceList;
import com.homestyler.space.SpaceDtos.SpaceListItem;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@Transactional
public class SpaceService {

    private static final int MAX_PHOTOS = 10;
    private static final double DEFAULT_HEIGHT_M = 2.3;

    @PersistenceContext
    private EntityManager em;

    private final SpaceRepository spaceRepository;
    private final FileStorageService fileStorage;
    private final AiEstimationService aiEstimation;

    public SpaceService(SpaceRepository spaceRepository, FileStorageService fileStorage,
                        AiEstimationService aiEstimation) {
        this.spaceRepository = spaceRepository;
        this.fileStorage = fileStorage;
        this.aiEstimation = aiEstimation;
    }

    // ---------- 공통 소유권 검증 (모든 핸들러가 이 한 곳을 통과) ----------

    public Space ownedSpace(Long spaceId, Long userId) {
        Space space = spaceRepository.findById(spaceId)
                .orElseThrow(() -> new ApiException(ErrorCode.RES_001));
        if (!space.getUserId().equals(userId)) {
            throw new ApiException(ErrorCode.AUTH_003); // 타인 리소스 → 403 (404 아님)
        }
        return space;
    }

    // ---------- Space CRUD ----------

    public SpaceCreated create(Long userId, CreateSpaceRequest req) {
        SpaceType type = parseEnum(SpaceType.class, req.spaceType());
        String name = (req.name() == null || req.name().isBlank()) ? type.korName() : req.name().trim();
        Space space = spaceRepository.save(new Space(userId, type, name));
        return new SpaceCreated(space.getId(), space.getSpaceType(), space.getName(), 0, space.getCreatedAt());
    }

    @Transactional(readOnly = true)
    public SpaceList list(Long userId) {
        List<SpaceListItem> items = spaceRepository.findByUserIdOrderByIdDesc(userId).stream()
                .map(s -> new SpaceListItem(
                        s.getId(), s.getSpaceType(), s.getName(),
                        s.getPhotos().size(),
                        s.getPhotos().isEmpty() ? null : servingUrl(s.getPhotos().get(0).getStoredFilename()),
                        s.getCreatedAt()))
                .toList();
        return new SpaceList(items);
    }

    @Transactional(readOnly = true)
    public SpaceDetail detail(Long spaceId, Long userId) {
        Space space = ownedSpace(spaceId, userId);
        return toDetail(space);
    }

    public SpaceDtos.SpaceIdResult delete(Long spaceId, Long userId) {
        Space space = ownedSpace(spaceId, userId);
        // 사진 파일 물리 삭제 (DB 행은 cascade 로 정리)
        space.getPhotos().forEach(p -> fileStorage.delete(p.getStoredFilename()));
        spaceRepository.delete(space);
        return new SpaceDtos.SpaceIdResult(spaceId);
    }

    // ---------- 사진 ----------

    public PhotoUploadResult addPhoto(Long spaceId, Long userId, MultipartFile file, boolean isFloorPlan) {
        Space space = ownedSpace(spaceId, userId);
        if (space.getPhotos().size() >= MAX_PHOTOS) {
            throw new ApiException(ErrorCode.VALID_003, "공간당 사진은 최대 " + MAX_PHOTOS + "장까지 등록할 수 있습니다.");
        }
        boolean firstPhoto = space.getPhotos().isEmpty();

        String stored = fileStorage.store(file); // 형식·용량 검증 + EXIF 제거
        SpacePhoto photo = new SpacePhoto(stored, isFloorPlan);
        space.addPhoto(photo);

        List<DetectedFurnitureDto> detected = new ArrayList<>();
        // 최초 사진 등록 시에만 Mock AI 로 치수·가구 추정
        if (firstPhoto && space.getDimension() == null) {
            Estimation est = aiEstimation.estimate(space.getSpaceType());
            Dimension dim = new Dimension(
                    est.dimension().widthM(), est.dimension().depthM(), est.dimension().heightM(),
                    est.dimension().confidence(), false);
            space.setDimension(dim);
            est.furniture().forEach(f -> space.getFurniture()
                    .add(new Furniture(space, f.type(), f.label(), false, FurnitureSource.AI_DETECTED)));
        }

        em.flush(); // 관리 엔티티 → cascade-persist 로 photo/dimension/furniture 실제 인스턴스에 생성 id 채움

        if (firstPhoto) {
            space.getFurniture().stream()
                    .filter(f -> f.getSource() == FurnitureSource.AI_DETECTED)
                    .forEach(f -> detected.add(new DetectedFurnitureDto(f.getId(), f.getType(), f.getLabel())));
        }

        return new PhotoUploadResult(photo.getId(), servingUrl(stored), photo.isFloorPlan(),
                QualityCheck.PASSED, detected);
    }

    public SpaceDtos.PhotoIdResult deletePhoto(Long spaceId, Long photoId, Long userId) {
        Space space = ownedSpace(spaceId, userId);
        SpacePhoto photo = space.getPhotos().stream()
                .filter(p -> p.getId().equals(photoId))
                .findFirst()
                .orElseThrow(() -> new ApiException(ErrorCode.RES_001));
        fileStorage.delete(photo.getStoredFilename());
        space.removePhoto(photo);
        em.flush(); // 관리 엔티티 → cascade-persist 로 실제 인스턴스에 생성 id 채움 (merge 복사본 아님)
        return new SpaceDtos.PhotoIdResult(photoId);
    }

    // ---------- 치수 ----------

    public DimensionResult updateDimensions(Long spaceId, Long userId, DimensionUpdateRequest req) {
        Space space = ownedSpace(spaceId, userId);
        Dimension dim = space.getDimension();

        double width = pick(req.widthM(), dim == null ? null : dim.getWidthM());
        double depth = pick(req.depthM(), dim == null ? null : dim.getDepthM());
        Double heightIn = req.heightM() != null ? req.heightM()
                : (dim == null ? null : dim.getHeightM());
        double height = heightIn != null ? heightIn : DEFAULT_HEIGHT_M;

        validateRange(width, 1.0, 20.0, "가로");
        validateRange(depth, 1.0, 20.0, "세로");
        validateRange(height, 2.0, 5.0, "높이");

        boolean verified = req.isUserVerified() != null && req.isUserVerified();

        if (dim == null) {
            dim = new Dimension(width, depth, height, verified ? Confidence.HIGH : Confidence.MEDIUM, verified);
            space.setDimension(dim);
        } else {
            dim.update(width, depth, height, verified);
        }

        if (req.openings() != null) {
            dim.replaceOpenings(toOpenings(req.openings()));
        }

        em.flush(); // 관리 엔티티 → cascade-persist 로 실제 인스턴스에 생성 id 채움 (merge 복사본 아님)

        return new DimensionResult(spaceId, dim.getWidthM(), dim.getDepthM(), dim.getHeightM(),
                dim.areaPyeong(), dim.isUserVerified(), toOpeningDtos(dim.getOpenings()));
    }

    // ---------- 가구 (전체 목록 교체) ----------

    public FurnitureListResult replaceFurniture(Long spaceId, Long userId, FurniturePutRequest req) {
        Space space = ownedSpace(spaceId, userId);
        List<FurnitureItemRequest> requested = req.furniture() == null ? List.of() : req.furniture();

        Map<Long, Furniture> existing = new LinkedHashMap<>();
        space.getFurniture().forEach(f -> existing.put(f.getId(), f));

        List<Furniture> result = new ArrayList<>();
        for (FurnitureItemRequest item : requested) {
            FurnitureType type = parseEnum(FurnitureType.class, item.type());
            String label = item.label() == null ? "" : item.label().trim();
            boolean keep = item.keep() != null && item.keep();

            if (item.furnitureId() != null) {
                Furniture f = existing.get(item.furnitureId());
                if (f == null) {
                    throw new ApiException(ErrorCode.RES_001); // 이 공간에 없는 furnitureId
                }
                f.update(type, label, keep);
                result.add(f);
            } else {
                result.add(new Furniture(space, type, label, keep, FurnitureSource.USER_ADDED));
            }
        }

        // 요청에 빠진 기존 항목 삭제 (orphanRemoval)
        space.getFurniture().clear();
        space.getFurniture().addAll(result);
        em.flush(); // 관리 엔티티 → cascade-persist 로 실제 인스턴스에 생성 id 채움 (merge 복사본 아님)

        return new FurnitureListResult(space.getFurniture().stream().map(this::toFurnitureDto).toList());
    }

    // ---------- 매핑·헬퍼 ----------

    private SpaceDetail toDetail(Space space) {
        List<PhotoDto> photos = space.getPhotos().stream()
                .map(p -> new PhotoDto(p.getId(), servingUrl(p.getStoredFilename()), p.isFloorPlan()))
                .toList();
        Dimension dim = space.getDimension();
        DimensionDto dimDto = dim == null ? null : new DimensionDto(
                dim.getWidthM(), dim.getDepthM(), dim.getHeightM(), dim.areaPyeong(),
                dim.getConfidence(), dim.isUserVerified(), toOpeningDtos(dim.getOpenings()));
        List<FurnitureDto> furniture = space.getFurniture().stream().map(this::toFurnitureDto).toList();
        return new SpaceDetail(space.getId(), space.getSpaceType(), space.getName(), photos, dimDto, furniture);
    }

    private FurnitureDto toFurnitureDto(Furniture f) {
        return new FurnitureDto(f.getId(), f.getType(), f.getLabel(), f.isKeep(), f.getSource());
    }

    private List<OpeningDto> toOpeningDtos(List<Opening> openings) {
        return openings.stream()
                .map(o -> new OpeningDto(o.getId(), o.getType(), o.getWall(), o.getWidthM()))
                .toList();
    }

    private List<Opening> toOpenings(List<OpeningRequest> reqs) {
        List<Opening> list = new ArrayList<>();
        for (OpeningRequest r : reqs) {
            OpeningType type = parseEnum(OpeningType.class, r.type());
            Wall wall = parseEnum(Wall.class, r.wall());
            double w = r.widthM() == null ? 0.0 : r.widthM();
            validateRange(w, 0.1, 20.0, "개구부 너비");
            list.add(new Opening(type, wall, w));
        }
        return list;
    }

    private String servingUrl(String storedFilename) {
        return "/files/" + storedFilename;
    }

    private double pick(Double in, Double existing) {
        if (in != null) {
            return in;
        }
        if (existing != null) {
            return existing;
        }
        throw new ApiException(ErrorCode.VALID_003, "치수 값이 누락되었습니다.");
    }

    private void validateRange(double v, double min, double max, String field) {
        if (v < min || v > max) {
            throw new ApiException(ErrorCode.VALID_003,
                    field + "은(는) " + min + "~" + max + " 범위여야 합니다.");
        }
    }

    private <E extends Enum<E>> E parseEnum(Class<E> type, String value) {
        if (value == null) {
            throw new ApiException(ErrorCode.VALID_003, "필수 유형 값이 누락되었습니다.");
        }
        try {
            return Enum.valueOf(type, value.trim());
        } catch (IllegalArgumentException e) {
            throw new ApiException(ErrorCode.VALID_003, "정의되지 않은 값입니다: " + value);
        }
    }
}
