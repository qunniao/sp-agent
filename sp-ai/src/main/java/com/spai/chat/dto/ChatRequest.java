package com.spai.chat.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * 问答请求。
 *
 * @param employeeId 虚拟员工标识，可省略；省略或未命中白名单时按通用客服问答处理
 */
public record ChatRequest(
        String sessionId,
        @NotBlank(message = "消息不能为空") String message,
        String employeeId
) {
}
