package com.spai.skill.order;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * 订单金额统计技能的安全阈值。
 */
@Data
@Component
@ConfigurationProperties(prefix = "sp-ai.skill.order-amount")
public class OrderAmountSkillProperties {

    /** 未传日期时默认统计的天数 */
    private int defaultRangeDays = 30;

    /** 单次查询允许的最大跨度天数，用于阻断全表聚合 */
    private int maxRangeDays = 366;

    /** 同一会话每分钟允许调用的次数，防止模型自循环刷量 */
    private int rateLimitPerMinute = 5;
}
