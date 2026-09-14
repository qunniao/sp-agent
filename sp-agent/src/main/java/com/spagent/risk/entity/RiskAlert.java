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
 * 风险预警记录。
 */
@Data
@TableName("risk_alert")
public class RiskAlert {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String sessionId;

    private String customerId;

    private String message;

    /** LOW/MEDIUM/HIGH */
    private String level;

    private String reason;

    /** 是否已处理（转人工/人工介入） */
    private Boolean handled;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    @TableLogic
    private Integer deleted;
}
