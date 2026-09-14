package com.sp.base.framework.security;

/**
 * 当前操作人提供者接口
 * <p>
 * 由认证模块实现，从 JWT / SecurityContext 获取登录用户名。
 * 默认实现返回 "anonymous"，确保认证模块上线前不阻塞其他功能。
 * <p>
 * 使用方式：
 * <pre>{@code
 * @Autowired
 * private OperatorProvider operatorProvider;
 * String username = operatorProvider.getCurrentOperator();
 * }</pre>
 */
@FunctionalInterface
public interface OperatorProvider {

    /**
     * 获取当前操作人标识
     *
     * @return 用户名或 "anonymous"
     */
    String getCurrentOperator();
}
