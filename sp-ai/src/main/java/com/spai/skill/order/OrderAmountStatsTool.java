package com.spai.skill.order;

import com.spai.order.dto.OrderAmountSummary;
import com.spai.order.service.OrderService;
import com.spai.skill.SkillDeniedException;
import com.spai.skill.SkillGuard;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.tool.annotation.Tool;

/**
 * 技能：订单金额统计。
 *
 * <p>每个会话一个实例，员工与会话在构造时绑定，模型无法通过参数改变调用者身份。
 * 技能内部不抛异常：拒绝与失败都转成 success=false 的结果交给模型转述，
 * 避免把 SQL、表结构或堆栈暴露到对话与日志之外的地方。</p>
 */
@Slf4j
@RequiredArgsConstructor
public class OrderAmountStatsTool {

    private static final String SKILL = "order-amount-stats";

    private final SkillGuard guard;
    private final OrderService orderService;
    private final String employeeId;
    private final String sessionId;

    @Tool(name = SKILL, description = "只读统计订单笔数与金额合计。可按日期区间和订单状态过滤，默认统计最近30天。只返回笔数与总金额，不返回订单明细。这是订单数据的唯一来源：不调用本工具就不得给出任何金额或笔数。")
    public OrderAmountStats sumOrderAmount(OrderAmountQuery query) {
        OrderAmountQuery safeQuery = query == null ? new OrderAmountQuery(null, null, null) : query;
        try {
            SkillGuard.OrderAmountScope scope = guard.checkOrderAmount(employeeId, sessionId, safeQuery);
            OrderAmountSummary summary = orderService.sumAmount(scope.startDate(), scope.endDate(), scope.status());
            guard.audit(employeeId, sessionId, SKILL, "SUCCESS",
                    "range=" + summary.startDate() + "~" + summary.endDate() + " status=" + summary.status()
                            + " count=" + summary.orderCount() + " amount=" + summary.totalAmount());
            return OrderAmountStats.ok(summary);
        } catch (SkillDeniedException e) {
            guard.audit(employeeId, sessionId, SKILL, "DENIED", e.getMessage());
            return OrderAmountStats.rejected(e.getMessage());
        } catch (Exception e) {
            guard.audit(employeeId, sessionId, SKILL, "ERROR", e.getClass().getSimpleName());
            log.error("[skill] 订单金额统计失败 employee={} session={} range={}~{}", employeeId, sessionId,
                    safeQuery.startDate(), safeQuery.endDate(), e);
            return OrderAmountStats.rejected("订单金额统计暂时不可用，请稍后重试");
        }
    }
}
