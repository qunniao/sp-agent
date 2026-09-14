package com.spagent.chat.controller;

import com.spagent.chat.dto.ChatReply;
import com.spagent.chat.dto.ChatRequest;
import com.spagent.chat.service.ChatService;
import com.spagent.common.api.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 智能问答入口。
 */
@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    @PostMapping("/message")
    public ApiResponse<ChatReply> message(@Valid @RequestBody ChatRequest request) {
        String sessionId = request.sessionId() == null || request.sessionId().isBlank()
                ? "default"
                : request.sessionId();
        return ApiResponse.ok(chatService.chat(sessionId, request.message()));
    }
}
