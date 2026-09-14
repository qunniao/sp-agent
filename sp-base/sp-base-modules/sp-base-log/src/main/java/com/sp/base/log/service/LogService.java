package com.sp.base.log.service;

import com.sp.base.log.dto.LogQueryDTO;
import com.sp.base.common.PageResult;
import com.sp.base.log.entity.LoginLog;
import com.sp.base.log.entity.OperationLog;

/**
 * 日志服务接口
 */
public interface LogService {

    /**
     * 分页查询操作日志
     */
    PageResult<OperationLog> getOperationLogs(LogQueryDTO query);

    /**
     * 分页查询登录日志
     */
    PageResult<LoginLog> getLoginLogs(LogQueryDTO query);

    /**
     * 异步记录操作日志
     */
    void recordOperationLog(OperationLog logEntry);

    /**
     * 异步记录登录日志
     */
    void recordLoginLog(LoginLog logEntry);
}
