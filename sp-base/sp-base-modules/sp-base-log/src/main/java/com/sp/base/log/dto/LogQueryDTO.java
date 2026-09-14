package com.sp.base.log.dto;

import com.sp.base.common.PageParams;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

/**
 * 日志查询参数
 * <p>
 * 操作日志使用 operator / action 字段，登录日志使用 username 字段。
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class LogQueryDTO extends PageParams {

    /** 操作人（操作日志） */
    private String operator;

    /** 操作类型（操作日志） */
    private String action;

    /** 请求方法（操作日志） */
    private String method;

    /** 用户名（登录日志） */
    private String username;

    /** 状态：1=成功 0=失败 */
    private Integer status;

    /** 开始时间 */
    private LocalDateTime startTime;

    /** 结束时间 */
    private LocalDateTime endTime;
}
