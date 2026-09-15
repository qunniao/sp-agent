package com.spai.risk.dto;

/**
 * 风险检测结果。
 */
public record RiskResult(String level, String reason, Long alertId, Long handoffId) {
}
