package com.spai.risk.service;

import com.spai.risk.dto.RiskResult;
import com.spai.risk.entity.HumanHandoff;
import com.spai.risk.entity.RiskAlert;
import com.spai.risk.mapper.HumanHandoffMapper;
import com.spai.risk.mapper.RiskAlertMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * 风险预警服务：敏感词识别 + 高风险会话自动转人工。
 */
@Service
@RequiredArgsConstructor
public class RiskService {

    private static final List<String> SENSITIVE_WORDS = List.of(
            "投诉", "差评", "曝光", "媒体", "12315", "消协", "律师", "起诉", "报警", "诈骗", "退款投诉", "工商");

    private final RiskAlertMapper alertMapper;
    private final HumanHandoffMapper handoffMapper;

    public RiskResult check(String sessionId, String customerId, String message) {
        String level = "LOW";
        String reason = "未命中风险";

        for (String word : SENSITIVE_WORDS) {
            if (message != null && message.contains(word)) {
                level = "HIGH";
                reason = "命中敏感词：" + word;
                break;
            }
        }

        RiskAlert alert = new RiskAlert();
        alert.setSessionId(sessionId);
        alert.setCustomerId(customerId);
        alert.setMessage(message);
        alert.setLevel(level);
        alert.setReason(reason);
        alert.setHandled(false);
        alertMapper.insert(alert);

        Long handoffId = null;
        if ("HIGH".equals(level)) {
            HumanHandoff handoff = new HumanHandoff();
            handoff.setRiskAlertId(alert.getId());
            handoff.setSessionId(sessionId);
            handoff.setCustomerId(customerId);
            handoff.setSummary(message);
            handoff.setStatus("PENDING");
            handoffMapper.insert(handoff);
            handoffId = handoff.getId();
            alert.setHandled(true);
            alertMapper.updateById(alert);
        }

        return new RiskResult(level, reason, alert.getId(), handoffId);
    }
}
