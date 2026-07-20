package com.homestyler.home;

import com.homestyler.common.ApiResponse;
import com.homestyler.common.exception.ApiException;
import com.homestyler.common.exception.ErrorCode;
import com.homestyler.home.HomeDtos.StyleDetail;
import com.homestyler.home.HomeDtos.StyleList;
import com.homestyler.home.HomeDtos.StyleListItem;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Arrays;

@RestController
@RequestMapping("/api/v1/styles")
public class StyleController {

    @GetMapping
    public ApiResponse<StyleList> list() {
        var items = Arrays.stream(StyleType.values())
                .map(s -> new StyleListItem(s.name(), s.getTitle(), s.thumbnailUrl(), s.getDescription()))
                .toList();
        return ApiResponse.ok(new StyleList(items));
    }

    @GetMapping("/{styleType}")
    public ApiResponse<StyleDetail> detail(@PathVariable String styleType) {
        StyleType style;
        try {
            style = StyleType.valueOf(styleType.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new ApiException(ErrorCode.RES_001);
        }
        return ApiResponse.ok(new StyleDetail(
                style.name(), style.getTitle(), style.getDescription(),
                style.getKeywords(), style.gallery()));
    }
}
