package com.sp.base.log.controller;

import com.sp.base.common.ApiResponse;
import com.sp.base.common.PageResult;
import com.sp.base.log.dto.LogQueryDTO;
import com.sp.base.log.entity.LoginLog;
import com.sp.base.log.entity.OperationLog;
import com.sp.base.log.service.LogService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 日志管理 Controller
 */
@RestController
@RequestMapping("/log")
@RequiredArgsConstructor
public class LogController {

    private final LogService logService;

    /**
     * 分页查询操作日志
     * <pre>
     * GET /api/log/operation?operator=&action=&status=&startTime=&endTime=&page=1&pageSize=10
     * </pre>
     */
    @GetMapping("/operation")
    public ApiResponse<PageResult<OperationLog>> getOperationLogs(LogQueryDTO query) {
        return ApiResponse.ok(logService.getOperationLogs(query));
    }

    /**
     * 分页查询登录日志
     * <pre>
     * GET /api/log/login?username=&status=&startTime=&endTime=&page=1&pageSize=10
     * </pre>
     */
    @GetMapping("/login")
    public ApiResponse<PageResult<LoginLog>> getLoginLogs(LogQueryDTO query) {
        return ApiResponse.ok(logService.getLoginLogs(query));
    }
}
