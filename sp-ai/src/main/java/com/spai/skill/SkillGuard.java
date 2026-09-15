package com.spai.skill;

import com.spai.order.entity.Order;
import com.spai.skill.order.OrderAmountQuery;
import com.spai.skill.order.OrderAmountSkillProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.time.temporal.ChronoUnit;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 技能安全闸门：所有技能的入参校验、限流与审计集中在此，技能实现不再各自处理。
 *
 * <p>校验通过后返回服务端归一化的查询范围，技能只允许使用归一化后的值，
 * 模型给出的原始参数不直接进入数据访问层。</p>
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SkillGuard {

    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ISO_LOCAL_DATE;
    private static final long RATE_WINDOW_MILLIS = 60_000L;
    private static final int MAX_TRACKED_SESSIONS = 2_000;

    private final OrderAmountSkillProperties orderAmountProperties;

    /** sessionId -> 最近一分钟内的调用时间戳 */
    private final Map<String, Deque<Long>> callRecords = new ConcurrentHashMap<>();

    /**
     * 校验订单金额统计入参，返回归一化后的查询范围。
     *
     * @throws SkillDeniedException 参数非法或触发限流
     */
    public OrderAmountScope checkOrderAmount(String employeeId, String sessionId, OrderAmountQuery query) {
        checkRateLimit(employeeId, sessionId);

        LocalDate today = LocalDate.now();
        LocalDate end = parseDate(query.endDate(), "结束日期");
        LocalDate start = parseDate(query.startDate(), "开始日期");

        if (end == null) {
            end = today;
        }
        if (start == null) {
            start = end.minusDays(orderAmountProperties.getDefaultRangeDays() - 1L);
        }
        if (start.isAfter(end)) {
            throw new SkillDeniedException("开始日期不能晚于结束日期");
        }
        if (end.isAfter(today)) {
            throw new SkillDeniedException("结束日期不能晚于今天");
        }

        long span = ChronoUnit.DAYS.between(start, end) + 1;
        if (span > orderAmountProperties.getMaxRangeDays()) {
            throw new SkillDeniedException("查询跨度不得超过 " + orderAmountProperties.getMaxRangeDays() + " 天，请缩小时间范围");
        }
        return new OrderAmountScope(start, end, normalizeStatus(query.status()));
    }

    /** 记录一次技能调用，成功、拒绝、异常都要留痕，便于事后审计与异常发现 */
    public void audit(String employeeId, String sessionId, String skill, String phase, Object detail) {
        log.info("[skill-audit] skill={} phase={} employee={} session={} detail={}", skill, phase, employeeId, sessionId, detail);
    }

    /** 严格按 yyyy-MM-dd 解析，不做宽松解析，避免模型输出被误读成别的日期 */
    private LocalDate parseDate(String raw, String fieldName) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        try {
            return LocalDate.parse(raw.trim(), DATE_FORMAT);
        } catch (DateTimeParseException e) {
            throw new SkillDeniedException(fieldName + "格式不正确，必须是 yyyy-MM-dd");
        }
    }

    private String normalizeStatus(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        String status = raw.trim().toUpperCase(Locale.ROOT);
        if (!Order.STATUSES.contains(status)) {
            throw new SkillDeniedException("不支持的订单状态：" + status);
        }
        return status;
    }

    private void checkRateLimit(String employeeId, String sessionId) {
        long now = System.currentTimeMillis();
        if (callRecords.size() > MAX_TRACKED_SESSIONS) {
            callRecords.values().removeIf(Deque::isEmpty);
        }
        Deque<Long> records = callRecords.computeIfAbsent(sessionId, k -> new ArrayDeque<>());
        synchronized (records) {
            while (!records.isEmpty() && records.peekFirst() < now - RATE_WINDOW_MILLIS) {
                records.pollFirst();
            }
            if (records.size() >= orderAmountProperties.getRateLimitPerMinute()) {
                audit(employeeId, sessionId, "order-amount-stats", "RATE_LIMITED", null);
                throw new SkillDeniedException("查询过于频繁，请稍后再试");
            }
            records.addLast(now);
        }
    }

    /**
     * 归一化后的查询范围，技能只能按此范围取数。
     */
    public record OrderAmountScope(LocalDate startDate, LocalDate endDate, String status) {
    }
}
