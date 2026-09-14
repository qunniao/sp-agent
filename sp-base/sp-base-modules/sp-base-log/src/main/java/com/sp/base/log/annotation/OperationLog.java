package com.sp.base.log.annotation;

import java.lang.annotation.*;

/**
 * 操作日志注解
 * <p>
 * 标记在 Controller 方法上，AOP 切面自动记录操作日志。
 * 所有字段留空时，自动从 @RequestMapping 派生 method 和 path。
 *
 * <pre>{@code
 * @OperationLog(action = "用户管理")
 * @PostMapping("/users")
 * public ApiResponse<?> createUser(...) { ... }
 * }</pre>
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface OperationLog {

    /** 操作类型，如"用户管理"、"角色管理" */
    String value() default "";

    /** 操作类型（别名） */
    String action() default "";

    /** 请求方法，留空则自动派生 */
    String method() default "";

    /** 请求路径，留空则自动派生 */
    String path() default "";
}
