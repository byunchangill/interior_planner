package com.homestyler.space;

import com.homestyler.common.ApiResponse;
import com.homestyler.space.SpaceDtos.CreateSpaceRequest;
import com.homestyler.space.SpaceDtos.DimensionResult;
import com.homestyler.space.SpaceDtos.DimensionUpdateRequest;
import com.homestyler.space.SpaceDtos.FurnitureListResult;
import com.homestyler.space.SpaceDtos.FurniturePutRequest;
import com.homestyler.space.SpaceDtos.PhotoIdResult;
import com.homestyler.space.SpaceDtos.PhotoUploadResult;
import com.homestyler.space.SpaceDtos.SpaceCreated;
import com.homestyler.space.SpaceDtos.SpaceDetail;
import com.homestyler.space.SpaceDtos.SpaceIdResult;
import com.homestyler.space.SpaceDtos.SpaceList;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/spaces")
public class SpaceController {

    private final SpaceService spaceService;

    public SpaceController(SpaceService spaceService) {
        this.spaceService = spaceService;
    }

    @PostMapping
    public ApiResponse<SpaceCreated> create(@AuthenticationPrincipal Long userId,
                                            @RequestBody CreateSpaceRequest req) {
        return ApiResponse.ok(spaceService.create(userId, req));
    }

    @GetMapping
    public ApiResponse<SpaceList> list(@AuthenticationPrincipal Long userId) {
        return ApiResponse.ok(spaceService.list(userId));
    }

    @GetMapping("/{spaceId}")
    public ApiResponse<SpaceDetail> detail(@AuthenticationPrincipal Long userId,
                                           @PathVariable Long spaceId) {
        return ApiResponse.ok(spaceService.detail(spaceId, userId));
    }

    @DeleteMapping("/{spaceId}")
    public ApiResponse<SpaceIdResult> delete(@AuthenticationPrincipal Long userId,
                                             @PathVariable Long spaceId) {
        return ApiResponse.ok(spaceService.delete(spaceId, userId));
    }

    @PostMapping("/{spaceId}/photos")
    public ApiResponse<PhotoUploadResult> addPhoto(@AuthenticationPrincipal Long userId,
                                                   @PathVariable Long spaceId,
                                                   @RequestParam("file") MultipartFile file,
                                                   @RequestParam(value = "isFloorPlan", defaultValue = "false") boolean isFloorPlan) {
        return ApiResponse.ok(spaceService.addPhoto(spaceId, userId, file, isFloorPlan));
    }

    @DeleteMapping("/{spaceId}/photos/{photoId}")
    public ApiResponse<PhotoIdResult> deletePhoto(@AuthenticationPrincipal Long userId,
                                                  @PathVariable Long spaceId,
                                                  @PathVariable Long photoId) {
        return ApiResponse.ok(spaceService.deletePhoto(spaceId, photoId, userId));
    }

    @PatchMapping("/{spaceId}/dimensions")
    public ApiResponse<DimensionResult> updateDimensions(@AuthenticationPrincipal Long userId,
                                                         @PathVariable Long spaceId,
                                                         @RequestBody DimensionUpdateRequest req) {
        return ApiResponse.ok(spaceService.updateDimensions(spaceId, userId, req));
    }

    @PutMapping("/{spaceId}/furniture")
    public ApiResponse<FurnitureListResult> replaceFurniture(@AuthenticationPrincipal Long userId,
                                                             @PathVariable Long spaceId,
                                                             @RequestBody FurniturePutRequest req) {
        return ApiResponse.ok(spaceService.replaceFurniture(spaceId, userId, req));
    }
}
