package com.spai.chat.dto;

import java.util.List;

/**
 * 问答响应：模型回答 + 命中的知识库参考标题。
 */
public record ChatReply(String answer, List<String> references) {
}
