package com.spai.intent.dto;

/**
 * 意图分类结果。
 *
 * @param category 归一化类别（ORDER/COMPLAINT/CONSULT/RISK/CHITCHAT/OTHER）
 * @param raw      模型原始输出
 */
public record IntentResult(String category, String raw) {
}
