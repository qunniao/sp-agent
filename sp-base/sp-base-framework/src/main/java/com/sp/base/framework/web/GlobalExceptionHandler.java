package com.sp.base.framework.web;

import com.sp.base.common.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * 全局异常处理
 * <p>
 * 统一捕获 Controller 层异常，返回 ApiResponse 格式，
 * 避免异常堆栈直接暴露给前端。
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * 业务异常
     */
    @ExceptionHandler(IllegalArgumentException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiResponse<Void> handleIllegalArgument(IllegalArgumentException e, HttpServletRequest request) {
        log.warn("业务参数异常 [{}] {}: {}", request.getMethod(), request.getRequestURI(), e.getMessage());
        return ApiResponse.fail(400, e.getMessage());
    }

    /**
     * 兜底异常
     */
    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ApiResponse<Void> handleException(Exception e, HttpServletRequest request) {
        log.error("系统异常 [{}] {}: {}", request.getMethod(), request.getRequestURI(), e.getMessage(), e);
        return ApiResponse.fail(500, "服务器内部错误");
    }
}
