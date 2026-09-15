package com.spai.order.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.spai.common.exception.BizException;
import com.spai.order.entity.Order;
import com.spai.order.mapper.OrderMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

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
}
