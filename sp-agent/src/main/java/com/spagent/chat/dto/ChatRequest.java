package com.spagent.chat.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * 问答请求。
 */
public record ChatRequest(
        String sessionId,
        @NotBlank(message = "消息不能为空") String message
) {
}
