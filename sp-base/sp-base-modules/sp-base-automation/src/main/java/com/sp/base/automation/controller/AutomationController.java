package com.sp.base.automation.controller;

import com.sp.base.common.ApiResponse;
import com.sp.base.common.PageResult;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * 自动化工作流 Controller（Mock 模式）
 * <p>
 * 当前所有接口返回固定 mock 数据，后续替换为真实的 Service 层实现。
 */
@RestController
@RequestMapping("/automation")
public class AutomationController {

    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    // ==================== 工作流定义 CRUD ====================

    @GetMapping("/definitions")
    public ApiResponse<PageResult<Map<String, Object>>> listDefinitions(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int pageSize,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String keyword) {

        List<Map<String, Object>> templates = buildMockTemplates();
        // 分类过滤
        if (category != null && !"all".equals(category)) {
            templates = templates.stream()
                    .filter(t -> category.equals(t.get("category")))
                    .toList();
        }
        // 关键词过滤
        if (keyword != null && !keyword.isEmpty()) {
            String kw = keyword.toLowerCase();
            templates = templates.stream()
                    .filter(t -> ((String) t.get("name")).toLowerCase().contains(kw)
                            || ((String) t.get("description")).toLowerCase().contains(kw))
                    .toList();
        }

        int start = (page - 1) * pageSize;
        int end = Math.min(start + pageSize, templates.size());
        List<Map<String, Object>> records = start < templates.size()
                ? templates.subList(start, end)
                : Collections.emptyList();

        return ApiResponse.ok(new PageResult<>(records, (long) templates.size(), page, pageSize));
    }

    @GetMapping("/definitions/{id}")
    public ApiResponse<Map<String, Object>> getDefinition(@PathVariable String id) {
        return buildMockTemplates().stream()
                .filter(t -> id.equals(t.get("id")))
                .findFirst()
                .map(ApiResponse::ok)
                .orElse(ApiResponse.fail(404, "工作流不存在"));
    }

    @PostMapping("/definitions")
    public ApiResponse<Map<String, Object>> saveDefinition(@RequestBody Map<String, Object> body) {
        String now = LocalDateTime.now().format(FMT);
        if (!body.containsKey("id") || body.get("id") == null || "".equals(body.get("id"))) {
            body.put("id", "auto_" + UUID.randomUUID().toString().substring(0, 8));
            body.put("createdAt", now);
        }
        body.put("updatedAt", now);
        if (!body.containsKey("runCount")) body.put("runCount", 0);
        return ApiResponse.ok("保存成功", body);
    }

    @DeleteMapping("/definitions/{id}")
    public ApiResponse<Void> deleteDefinition(@PathVariable String id) {
        return ApiResponse.ok("删除成功", null);
    }

    @PutMapping("/definitions/{id}/toggle")
    public ApiResponse<Void> toggleDefinition(@PathVariable String id, @RequestBody Map<String, Boolean> body) {
        return ApiResponse.ok("操作成功", null);
    }

    @PostMapping("/definitions/{id}/trigger")
    public ApiResponse<String> triggerDefinition(@PathVariable String id) {
        return ApiResponse.ok("已触发执行", "exec_" + UUID.randomUUID().toString().substring(0, 8));
    }

    // ==================== 执行记录 ====================

    @GetMapping("/executions")
    public ApiResponse<PageResult<Map<String, Object>>> listExecutions(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int pageSize,
            @RequestParam(required = false) String automationId,
            @RequestParam(required = false) String status) {

        List<Map<String, Object>> executions = buildMockExecutions();
        if (automationId != null && !automationId.isEmpty()) {
            executions = executions.stream()
                    .filter(e -> automationId.equals(e.get("automationId")))
                    .toList();
        }
        if (status != null && !"all".equals(status)) {
            executions = executions.stream()
                    .filter(e -> status.equals(e.get("status")))
                    .toList();
        }

        int start = (page - 1) * pageSize;
        int end = Math.min(start + pageSize, executions.size());
        List<Map<String, Object>> records = start < executions.size()
                ? executions.subList(start, end)
                : Collections.emptyList();

        return ApiResponse.ok(new PageResult<>(records, (long) executions.size(), page, pageSize));
    }

    @GetMapping("/executions/{id}")
    public ApiResponse<Map<String, Object>> getExecution(@PathVariable String id) {
        return buildMockExecutions().stream()
                .filter(e -> id.equals(e.get("id")))
                .findFirst()
                .map(ApiResponse::ok)
                .orElse(ApiResponse.fail(404, "记录不存在"));
    }

    @PostMapping("/executions/{id}/cancel")
    public ApiResponse<Void> cancelExecution(@PathVariable String id) {
        return ApiResponse.ok("已取消", null);
    }

    // ==================== AI 编排（Mock） ====================

    @PostMapping("/ai/compose")
    public ApiResponse<Map<String, Object>> aiCompose(@RequestBody Map<String, String> body) {
        String description = body.getOrDefault("description", "");
        // 返回简化的工作流骨架
        Map<String, Object> result = new LinkedHashMap<>();
        Map<String, Object> def = new LinkedHashMap<>();
        def.put("name", "AI 生成的工作流");
        def.put("description", description);
        def.put("icon", "ThunderboltOutlined");
        def.put("category", "custom");
        def.put("enabled", false);

        Map<String, Object> trigger = new LinkedHashMap<>();
        trigger.put("type", "schedule");
        trigger.put("cron", "0 9 * * *");
        trigger.put("label", "每天上午 9:00");
        def.put("trigger", trigger);

        List<Map<String, Object>> steps = new ArrayList<>();
        steps.add(stepMap("s1", "ai.chat", "AI 处理", Map.of("prompt", description, "outputKey", "result")));
        steps.add(stepMap("s2", "notification", "通知我", Map.of("channel", "inapp", "title", "任务完成", "content", "{{step.s1.output}}")));
        def.put("steps", steps);

        result.put("def", def);
        result.put("explanation", "根据描述自动拆解为 AI 处理 + 通知 2 步，可在编辑器中继续调整。");

        return ApiResponse.ok(result);
    }

    // ==================== 辅助方法 ====================

    private Map<String, Object> stepMap(String id, String type, String title, Map<String, Object> config) {
        Map<String, Object> s = new LinkedHashMap<>();
        s.put("id", id);
        s.put("type", type);
        s.put("title", title);
        s.put("config", config);
        s.put("enabled", true);
        return s;
    }

    private List<Map<String, Object>> buildMockTemplates() {
        return List.of(
                template("tpl_xiaohongshu_daily", "小红书每日科普", "每天早上 9 点自动生成科技内容发布",
                        "content", "0 9 * * *", "每天上午 9:00", true, 12, List.of(
                                stepMap("s1", "ai.chat", "选题", Map.of("prompt", "生成 3 个爆款选题", "outputKey", "topics")),
                                stepMap("s2", "ai.chat", "写正文", Map.of("prompt", "写 300 字笔记", "outputKey", "content")),
                                stepMap("s3", "condition", "审核", Map.of("expression", "需人工审核", "branches", List.of(
                                        Map.of("label", "直接发布", "target", "next"),
                                        Map.of("label", "存草稿", "target", "end")
                                ))),
                                stepMap("s4", "platform.post", "发布", Map.of("platform", "xiaohongshu", "content", "{{step.s2.output}}"))
                        )),
                template("tpl_customer_followup", "客户跟进提醒", "每 4 小时检查未回复客户并生成跟进消息",
                        "business", "0 */4 * * *", "每 4 小时", true, 28, List.of(
                                stepMap("s1", "http.request", "查询客户", Map.of("url", "/api/customers?lastContact=24h", "method", "GET", "outputKey", "customers")),
                                stepMap("s2", "condition", "判断", Map.of("expression", "有未回复客户", "branches", List.of(
                                        Map.of("label", "有", "target", "next"),
                                        Map.of("label", "无", "target", "end")
                                ))),
                                stepMap("s3", "ai.chat", "生成消息", Map.of("prompt", "为未回复客户生成跟进消息", "outputKey", "messages")),
                                stepMap("s4", "notification", "通知", Map.of("channel", "inapp", "title", "客户跟进提醒", "content", "{{step.s3.output}}"))
                        )),
                template("tpl_weekly_report", "周一自动周报", "每周一汇总数据，AI 生成周报邮件",
                        "business", "0 9 * * 1", "每周一上午 9:00", false, 3, List.of(
                                stepMap("s1", "http.request", "拉取数据", Map.of("url", "/api/reports/weekly", "method", "GET", "outputKey", "data")),
                                stepMap("s2", "ai.chat", "生成周报", Map.of("prompt", "分析数据生成周报", "outputKey", "report")),
                                stepMap("s3", "notification", "发邮件", Map.of("channel", "email", "title", "周报", "content", "{{step.s2.output}}"))
                        )),
                template("tpl_invoice_monthly", "月度财务简报", "每月 1 日汇总收支，AI 分析趋势",
                        "business", "0 8 1 * *", "每月 1 日上午 8:00", false, 0, List.of(
                                stepMap("s1", "http.request", "拉取财务数据", Map.of("url", "/api/finance/summary?month=last", "method", "GET", "outputKey", "financeData")),
                                stepMap("s2", "ai.chat", "AI 分析", Map.of("prompt", "分析财务趋势", "outputKey", "analysis")),
                                stepMap("s3", "notification", "发送简报", Map.of("channel", "email", "title", "财务简报", "content", "{{step.s2.output}}"))
                        ))
        );
    }

    private Map<String, Object> template(String id, String name, String desc, String category,
                                          String cron, String cronLabel, boolean enabled, int runCount,
                                          List<Map<String, Object>> steps) {
        Map<String, Object> t = new LinkedHashMap<>();
        t.put("id", id);
        t.put("name", name);
        t.put("description", desc);
        t.put("icon", "ThunderboltOutlined");
        t.put("category", category);
        t.put("trigger", Map.of("type", "schedule", "cron", cron, "label", cronLabel));
        t.put("steps", steps);
        t.put("enabled", enabled);
        t.put("createdAt", "2026-06-20 10:00:00");
        t.put("updatedAt", "2026-06-25 09:00:00");
        t.put("runCount", runCount);
        if (runCount > 0) t.put("lastRunAt", "2026-06-26 09:00:00");
        return t;
    }

    private static final AtomicInteger EXEC_ID = new AtomicInteger(1);

    private List<Map<String, Object>> buildMockExecutions() {
        List<Map<String, Object>> list = new ArrayList<>();

        list.add(execution("tpl_xiaohongshu_daily", "小红书每日科普", "success",
                "2026-06-26 09:00:00", "2026-06-26 09:00:12", "定时触发",
                List.of(
                        stepResult("s1", "AI 选题", "success", 3000, "3 个选题已生成"),
                        stepResult("s2", "AI 写正文", "success", 5000, "正文已完成 300 字"),
                        stepResult("s3", "是否需人工审核？", "success", 0, "选择: 直接发布"),
                        stepResult("s4", "发布到小红书", "success", 4000, "发布成功")
                )));

        list.add(execution("tpl_customer_followup", "客户跟进提醒", "success",
                "2026-06-25 22:00:00", "2026-06-25 22:00:08", "定时触发",
                List.of(
                        stepResult("s1", "查询 24h 未回复客户", "success", 2000, "找到 2 位"),
                        stepResult("s2", "有需要跟进的客户？", "success", 0, "有 → 继续"),
                        stepResult("s3", "AI 生成跟进消息", "success", 5000, "消息已生成"),
                        stepResult("s4", "推送到站内消息", "success", 1000, "已推送")
                )));

        list.add(execution("tpl_xiaohongshu_daily", "小红书每日科普", "failed",
                "2026-06-24 09:00:00", "2026-06-24 09:00:08", "定时触发",
                List.of(
                        stepResult("s1", "AI 选题", "success", 3000, null),
                        stepResult("s2", "AI 写正文", "success", 5000, null),
                        stepResult("s3", "是否需人工审核？", "success", 0, null),
                        stepResult("s4", "发布到小红书", "failed", 0, null, "平台 API 返回 429: 限流")
                )));

        return list;
    }

    private Map<String, Object> execution(String autoId, String autoName, String status,
                                           String started, String finished, String triggeredBy,
                                           List<Map<String, Object>> stepResults) {
        Map<String, Object> e = new LinkedHashMap<>();
        e.put("id", "exec_" + EXEC_ID.getAndIncrement());
        e.put("automationId", autoId);
        e.put("automationName", autoName);
        e.put("status", status);
        e.put("startedAt", started);
        if (finished != null) e.put("finishedAt", finished);
        e.put("triggeredBy", triggeredBy);
        e.put("stepResults", stepResults);
        return e;
    }

    private Map<String, Object> stepResult(String stepId, String title, String status,
                                            long duration, String output) {
        return stepResult(stepId, title, status, duration, output, null);
    }

    private Map<String, Object> stepResult(String stepId, String title, String status,
                                            long duration, String output, String error) {
        Map<String, Object> s = new LinkedHashMap<>();
        s.put("stepId", stepId);
        s.put("stepTitle", title);
        s.put("status", status);
        s.put("duration", duration);
        if (output != null) s.put("output", output);
        if (error != null) s.put("error", error);
        return s;
    }
}
