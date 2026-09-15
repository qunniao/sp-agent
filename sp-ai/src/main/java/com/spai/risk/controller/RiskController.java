package com.spai.risk.controller;

import com.spai.common.api.ApiResponse;
import com.spai.risk.dto.RiskResult;
import com.spai.risk.service.RiskService;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 风险预警入口。
 */
@RestController
@RequestMapping("/api/risk")
@RequiredArgsConstructor
public class RiskController {

    public record CheckRequest(
            String sessionId,
            String customerId,
            @NotBlank(message = "消息不能为空") String message
    ) {
    }

    private final RiskService riskService;

    @PostMapping("/check")
    public ApiResponse<RiskResult> check(@RequestBody CheckRequest request) {
        return ApiResponse.ok(riskService.check(request.sessionId(), request.customerId(), request.message()));
    }
}
