package com.sp.base.framework.security;

import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.stereotype.Component;

/**
 * OperatorProvider 默认实现
 * <p>
 * 认证模块上线前返回 "anonymous"；
 * 认证模块上线后提供自己的 OperatorProvider Bean 即可自动替换。
 */
@Component
@ConditionalOnMissingBean(value = OperatorProvider.class, ignored = DefaultOperatorProvider.class)
public class DefaultOperatorProvider implements OperatorProvider {

    @Override
    public String getCurrentOperator() {
        return "anonymous";
    }
}
