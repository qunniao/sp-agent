package com.spagent.risk.entity;

import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 转人工工单。
 */
@Data
@TableName("human_handoff")
public class HumanHandoff {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long riskAlertId;

    private String sessionId;

    private String customerId;

    private String summary;

    /** PENDING/ASSIGNED/RESOLVED */
    private String status;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    @TableLogic
    private Integer deleted;
}
