package com.spai.chat.service;

import com.spai.chat.dto.ChatReply;
import com.spai.skill.EmployeeProfile;
import com.spai.skill.EmployeeRegistry;
import com.spai.skill.SkillRegistry;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.document.Document;
import org.springframework.ai.tool.ToolCallback;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.TextStyle;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * 智能问答服务：RAG 检索增强 + 多轮对话。
 *
 * <p>流程：用户问题 → 向量库召回 → 拼接知识上下文 + 对话历史 → 大模型生成回答。
 * 携带虚拟员工身份时额外挂载该员工被授权的技能，未命中员工白名单则走通用客服问答。</p>
 */
@Service
public class ChatService {

    private static final int TOP_K = 3;
    private static final double SIMILARITY_THRESHOLD = 0.5;

    private static final String DEFAULT_SYSTEM_PROMPT = """
            你是「超级客服」智能助手，请基于知识库内容回答用户问题。要求：
            1. 优先依据【知识库参考】回答；知识库没有的信息，如实说明并建议转人工。
            2. 回答简洁、礼貌、专业，避免编造。""";

    private final VectorStore vectorStore;
    private final ChatModel chatModel;
    private final ConversationMemory memory;
    private final EmployeeRegistry employeeRegistry;
    private final SkillRegistry skillRegistry;

    public ChatService(VectorStore vectorStore, ChatModel chatModel, ConversationMemory memory,
                       EmployeeRegistry employeeRegistry, SkillRegistry skillRegistry) {
        this.vectorStore = vectorStore;
        this.chatModel = chatModel;
        this.memory = memory;
        this.employeeRegistry = employeeRegistry;
        this.skillRegistry = skillRegistry;
    }

    /** 通用客服问答，不挂载任何技能 */
    public ChatReply chat(String sessionId, String message) {
        return chat(sessionId, message, null);
    }

    public ChatReply chat(String sessionId, String message, String employeeId) {
        List<Document> docs = retrieve(message);
        String body = buildBody(docs, memory.get(sessionId), message);

        Optional<EmployeeProfile> profile = employeeRegistry.find(employeeId);
        String answer = profile
                .map(p -> replyAsEmployee(p, sessionId, body))
                .orElseGet(() -> chatModel.call(DEFAULT_SYSTEM_PROMPT + "\n\n" + body));

        memory.add(sessionId, "user", message);
        memory.add(sessionId, "assistant", answer);

        List<String> references = docs.stream()
                .map(d -> (String) d.getMetadata().getOrDefault("title", d.getId()))
                .distinct()
                .toList();

        return new ChatReply(answer, references);
    }

    /** 虚拟员工按自己人设作答，并在授权范围内挂载技能 */
    private String replyAsEmployee(EmployeeProfile profile, String sessionId, String body) {
        ChatClient.Builder builder = ChatClient.builder(chatModel)
                .defaultSystem(profile.systemPrompt() + "\n\n" + currentDateHint());
        ToolCallback[] tools = skillRegistry.resolve(profile, sessionId);
        if (tools.length > 0) {
            builder.defaultToolCallbacks(tools);
        }
        String content = builder.build().prompt().user(body).call().content();
        return content == null || content.isBlank() ? "抱歉，我暂时没能生成回答，请换个说法再问一次。" : content;
    }

    /**
     * 注入服务器当天日期。
     *
     * <p>模型对"今天"没有可靠认知，实测会把"最近7天"算成两年前的日期区间；
     * 相对时间必须以服务端日期为基准换算成绝对日期后再传给技能。</p>
     */
    private String currentDateHint() {
        LocalDate today = LocalDate.now();
        return "【当前日期】" + today + "（" + today.getDayOfWeek().getDisplayName(TextStyle.FULL, Locale.CHINA)
                + "）。用户说的“今天”“最近N天”“本月”等相对时间，一律以该日期为基准换算成 yyyy-MM-dd 后再调用技能，不得凭记忆推测日期。";
    }

    private List<Document> retrieve(String query) {
        return vectorStore.similaritySearch(
                SearchRequest.builder()
                        .query(query)
                        .topK(TOP_K)
                        .similarityThreshold(SIMILARITY_THRESHOLD)
                        .build());
    }

    private String buildBody(List<Document> docs, List<ConversationMemory.Message> history, String message) {
        String context = docs.stream().map(Document::getText).collect(Collectors.joining("\n---\n"));
        StringBuilder sb = new StringBuilder();
        if (!context.isBlank()) {
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
