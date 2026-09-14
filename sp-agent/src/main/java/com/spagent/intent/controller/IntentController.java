package com.spagent.intent.controller;

import com.spagent.common.api.ApiResponse;
import com.spagent.intent.dto.IntentResult;
import com.spagent.intent.service.IntentService;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 意图分类入口。
 */
@RestController
@RequestMapping("/api/intent")
@RequiredArgsConstructor
public class IntentController {

    public record ClassifyRequest(@NotBlank(message = "文本不能为空") String text) {
    }

    private final IntentService intentService;

    @PostMapping("/classify")
    public ApiResponse<IntentResult> classify(@RequestBody ClassifyRequest request) {
        return ApiResponse.ok(intentService.classify(request.text()));
    }
}
