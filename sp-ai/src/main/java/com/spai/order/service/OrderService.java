package com.spai.order.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.spai.common.exception.BizException;
import com.spai.order.dto.OrderAmountSummary;
import com.spai.order.entity.Order;
import com.spai.order.mapper.OrderMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * 订单查询服务：按订单号 / 客户 id 查询订单与物流/售后状态。
 */
@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderMapper orderMapper;

    public Order getByOrderNo(String orderNo) {
        Order order = orderMapper.selectOne(
                new LambdaQueryWrapper<Order>().eq(Order::getOrderNo, orderNo));
        if (order == null) {
            throw new BizException(404, "订单不存在：" + orderNo);
        }
        return order;
    }

    public List<Order> listByCustomer(Long customerId) {
        return orderMapper.selectList(
                new LambdaQueryWrapper<Order>()
                        .eq(Order::getCustomerId, customerId)
                        .orderByDesc(Order::getCreateTime));
    }

    /**
     * 统计 [startDate, endDate] 闭区间内订单的笔数与金额合计。
     *
     * <p>只返回聚合值。日期区间与状态已由调用方（技能安全闸门）校验并归一化，
     * 这里只负责把闭区间转成左闭右开的时间边界。</p>
     */
    public OrderAmountSummary sumAmount(LocalDate startDate, LocalDate endDate, String status) {
        Map<String, Object> row = orderMapper.sumAmount(
                startDate.atStartOfDay(),
                endDate.plusDays(1).atStartOfDay(),
                status);
        return new OrderAmountSummary(startDate, endDate, status, toCount(row), toAmount(row));
    }

    private long toCount(Map<String, Object> row) {
        Object value = row == null ? null : row.get("order_count");
        return value instanceof Number number ? number.longValue() : 0L;
    }

    private BigDecimal toAmount(Map<String, Object> row) {
        Object value = row == null ? null : row.get("total_amount");
        return value instanceof BigDecimal amount ? amount : BigDecimal.ZERO;
    }
}
