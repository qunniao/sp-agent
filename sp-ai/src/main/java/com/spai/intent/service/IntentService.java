package com.spai.intent.service;

import com.spai.intent.dto.IntentResult;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * 意图分类服务：用大模型把用户消息归类，供后续路由到不同处理链路。
 */
@Service
public class IntentService {

    private static final List<String> CATEGORIES =
            List.of("ORDER", "COMPLAINT", "CONSULT", "RISK", "CHITCHAT", "OTHER");

    private static final String PROMPT = """
            你是电商客服意图分类器。请把用户消息归入以下类别之一，只输出类别英文名，不要输出其他内容：
            ORDER（订单/物流/售后进度查询）
            COMPLAINT（投诉、不满、催促）
            CONSULT（商品/业务/政策咨询）
            RISK（辱骂、威胁、敏感词、升级风险）
            CHITCHAT（闲聊）
            OTHER（其他）
            用户消息：%s
            """;

    private final ChatModel chatModel;

    public IntentService(ChatModel chatModel) {
        this.chatModel = chatModel;
    }

    public IntentResult classify(String text) {
        String raw = chatModel.call(PROMPT.formatted(text)).trim();
        return new IntentResult(normalize(raw), raw);
    }

    private String normalize(String raw) {
        String upper = raw.toUpperCase();
        for (String c : CATEGORIES) {
            if (upper.contains(c)) {
                return c;
            }
        }
        return "OTHER";
    }
}
