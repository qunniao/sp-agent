package com.spai.skill.order;

import org.springframework.ai.tool.annotation.ToolParam;

/**
 * 订单金额统计技能的入参，由模型生成。
 *
 * <p>三类参数都是弱类型的安全子集：日期用字符串严格解析为 LocalDate、状态走白名单、
 * 其余一律拒绝。模型无法把 SQL、表名、列名或排序方式传递进来。</p>
 */
public record OrderAmountQuery(
        @ToolParam(required = false, description = "统计开始日期，格式 yyyy-MM-dd，可省略，省略时默认最近30天")
        String startDate,

        @ToolParam(required = false, description = "统计结束日期，格式 yyyy-MM-dd，可省略，省略时默认今天")
        String endDate,

        @ToolParam(required = false, description = "订单状态过滤，可选值 PENDING/PAID/SHIPPED/COMPLETED/REFUNDING/REFUNDED，省略表示不限状态")
        String status
) {
}
