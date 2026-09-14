package com.sp.base.common;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 统一 API 响应包装
 * <p>
 * 所有后端接口统一返回此结构，前端 http 拦截器据此判断业务状态。
 *
 * @param <T> data 的具体类型
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ApiResponse<T> {

    /** 状态码：200 = 成功，其他 = 业务错误 */
    private int code;

    /** 响应消息 */
    private String message;

    /** 响应数据 */
    private T data;

    // ---- 静态工厂 ----

    public static <T> ApiResponse<T> ok(T data) {
        return new ApiResponse<>(200, "操作成功", data);
    }

    public static <T> ApiResponse<T> ok(String message, T data) {
        return new ApiResponse<>(200, message, data);
    }

    public static <T> ApiResponse<T> fail(int code, String message) {
        return new ApiResponse<>(code, message, null);
    }

    public static <T> ApiResponse<T> fail(String message) {
        return new ApiResponse<>(500, message, null);
    }
}
