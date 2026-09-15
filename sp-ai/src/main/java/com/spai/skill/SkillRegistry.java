package com.spai.skill;

import com.spai.order.service.OrderService;
import com.spai.skill.order.OrderAmountStatsTool;
import lombok.RequiredArgsConstructor;
import org.springframework.ai.support.ToolCallbacks;
import org.springframework.ai.tool.ToolCallback;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

/**
 * 技能装配：把员工被授权的技能转成模型可调用的工具回调。
 *
 * <p>未授权的技能不会出现在回调列表里，模型在参数层面就看不到，谈不上调用。</p>
 */
@Component
@RequiredArgsConstructor
public class SkillRegistry {

    private final SkillGuard skillGuard;
    private final OrderService orderService;

    public ToolCallback[] resolve(EmployeeProfile profile, String sessionId) {
        List<ToolCallback> callbacks = new ArrayList<>();
        if (profile.skills().contains(EmployeeRegistry.SKILL_ORDER_AMOUNT)) {
            callbacks.addAll(List.of(ToolCallbacks.from(
                    new OrderAmountStatsTool(skillGuard, orderService, profile.id(), sessionId))));
        }
        return callbacks.toArray(ToolCallback[]::new);
    }
}
