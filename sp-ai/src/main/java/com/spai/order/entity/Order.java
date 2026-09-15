package com.spai.order.entity;

import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Set;

/**
 * 订单。
 */
@Data
@TableName("orders")
public class Order {

    /** 订单状态白名单，用于技能入参校验 */
    public static final Set<String> STATUSES =
            Set.of("PENDING", "PAID", "SHIPPED", "COMPLETED", "REFUNDING", "REFUNDED");

    @TableId(type = IdType.AUTO)
    private Long id;

    private String orderNo;

    private Long customerId;

    private String productName;

    /** PENDING/PAID/SHIPPED/COMPLETED/REFUNDING/REFUNDED */
    private String status;

    private String logisticsNo;

    private String logisticsStatus;

    private BigDecimal amount;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    @TableLogic
    private Integer deleted;
}
