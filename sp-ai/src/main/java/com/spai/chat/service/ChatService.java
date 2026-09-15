package com.spai.chat.service;

import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

/**
 * 智能问答服务：RAG 检索增强 + 多轮对话。
 *
 * <p>流程：用户问题 → 向量库召回 → 拼接知识上下文 + 对话历史 → 大模型生成回答。</p>
 */
@Service
public class ChatService {

    private static final int TOP_K = 3;
    private static final double SIMILARITY_THRESHOLD = 0.5;

    private final VectorStore vectorStore;
    private final ChatModel chatModel;
    private final ConversationMemory memory;

    public ChatService(VectorStore vectorStore, ChatModel chatModel, ConversationMemory memory) {
        this.vectorStore = vectorStore;
        this.chatModel = chatModel;
        this.memory = memory;
    }

    public com.spai.chat.dto.ChatReply chat(String sessionId, String message) {
        List<Document> docs = retrieve(message);
        String context = docs.stream().map(Document::getText).collect(Collectors.joining("\n---\n"));

        List<ConversationMemory.Message> history = memory.get(sessionId);
        String answer = chatModel.call(buildPrompt(context, history, message));

        memory.add(sessionId, "user", message);
        memory.add(sessionId, "assistant", answer);

        List<String> references = docs.stream()
                .map(d -> (String) d.getMetadata().getOrDefault("title", d.getId()))
                .distinct()
                .toList();

        return new com.spai.chat.dto.ChatReply(answer, references);
    }

    private List<Document> retrieve(String query) {
        return vectorStore.similaritySearch(
                SearchRequest.builder()
                        .query(query)
                        .topK(TOP_K)
                        .similarityThreshold(SIMILARITY_THRESHOLD)
                        .build());
    }

    private String buildPrompt(String context, List<ConversationMemory.Message> history, String message) {
        StringBuilder sb = new StringBuilder();
        sb.append("你是「超级客服」智能助手，请基于知识库内容回答用户问题。要求：\n");
        sb.append("1. 优先依据【知识库参考】回答；知识库没有的信息，如实说明并建议转人工。\n");
        sb.append("2. 回答简洁、礼貌、专业，避免编造。\n\n");

        if (context != null && !context.isBlank()) {
            sb.append("【知识库参考】\n").append(context).append("\n\n");
        }
        if (!history.isEmpty()) {
            sb.append("【对话历史】\n");
            for (ConversationMemory.Message m : history) {
                sb.append(m.role()).append(": ").append(m.content()).append("\n");
            }
            sb.append("\n");
        }
        sb.append("【用户】").append(message);
        return sb.toString();
    }
}
