package com.spai.order.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * 订单金额聚合结果（业务层返回值，不含任何明细）。
 */
public record OrderAmountSummary(
        LocalDate startDate,
        LocalDate endDate,
        String status,
        long orderCount,
        BigDecimal totalAmount
) {
}
