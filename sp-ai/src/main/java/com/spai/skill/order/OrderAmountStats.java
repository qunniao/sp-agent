package com.spai.skill.order;

import com.spai.order.dto.OrderAmountSummary;

import java.math.BigDecimal;

/**
 * 订单金额统计技能的回参。
 *
 * <p>只暴露笔数与金额合计，不含明细行、订单号与客户信息，从数据形态上杜绝越权取数；
 * 被拒绝或失败时不抛异常，而是以 success=false 交给模型转述，避免堆栈与 SQL 泄漏到对话里。</p>
 */
public record OrderAmountStats(
        boolean success,
        String message,
        String startDate,
        String endDate,
        String status,
        Long orderCount,
        BigDecimal totalAmount
) {

    static OrderAmountStats ok(OrderAmountSummary summary) {
        String scope = summary.status() == null ? "全部状态" : summary.status();
        return new OrderAmountStats(true, "统计成功", summary.startDate().toString(), summary.endDate().toString(),
                scope, summary.orderCount(), summary.totalAmount());
    }

    static OrderAmountStats rejected(String reason) {
        return new OrderAmountStats(false, reason, null, null, null, null, null);
    }
}
