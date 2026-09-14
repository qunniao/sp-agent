package com.sp.base.log.service.impl;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.sp.base.common.PageResult;
import com.sp.base.log.dto.LogQueryDTO;
import com.sp.base.log.entity.LoginLog;
import com.sp.base.log.entity.OperationLog;
import com.sp.base.log.mapper.LoginLogMapper;
import com.sp.base.log.mapper.OperationLogMapper;
import com.sp.base.log.service.LogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

/**
 * 日志服务实现
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class LogServiceImpl implements LogService {

    private final OperationLogMapper operationLogMapper;
    private final LoginLogMapper loginLogMapper;

    @Override
    public PageResult<OperationLog> getOperationLogs(LogQueryDTO query) {
        Page<OperationLog> mpPage = new Page<>(query.getPage(), query.getPageSize());
        Page<OperationLog> result = operationLogMapper.selectPageWithQuery(mpPage, query);
        return new PageResult<>(
                result.getRecords(),
                result.getTotal(),
                result.getCurrent(),
                result.getSize()
        );
    }

    @Override
    public PageResult<LoginLog> getLoginLogs(LogQueryDTO query) {
        Page<LoginLog> mpPage = new Page<>(query.getPage(), query.getPageSize());
        Page<LoginLog> result = loginLogMapper.selectPageWithQuery(mpPage, query);
        return new PageResult<>(
                result.getRecords(),
                result.getTotal(),
                result.getCurrent(),
                result.getSize()
        );
    }

    @Async("logExecutor")
    @Override
    public void recordOperationLog(OperationLog logEntry) {
        try {
            operationLogMapper.insert(logEntry);
        } catch (Exception e) {
            log.error("异步写入操作日志失败: path={}, operator={}", logEntry.getPath(), logEntry.getOperator(), e);
        }
    }

    @Async("logExecutor")
    @Override
    public void recordLoginLog(LoginLog logEntry) {
        try {
            loginLogMapper.insert(logEntry);
        } catch (Exception e) {
            log.error("异步写入登录日志失败: username={}", logEntry.getUsername(), e);
        }
    }
}
