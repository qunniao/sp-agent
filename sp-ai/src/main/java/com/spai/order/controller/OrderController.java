package com.spai.order.controller;

import com.spai.common.api.ApiResponse;
import com.spai.order.entity.Order;
import com.spai.order.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 订单查询入口。
 */
@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @GetMapping("/{orderNo}")
    public ApiResponse<Order> getByOrderNo(@PathVariable String orderNo) {
        return ApiResponse.ok(orderService.getByOrderNo(orderNo));
    }

    @GetMapping
    public ApiResponse<List<Order>> listByCustomer(@RequestParam Long customerId) {
        return ApiResponse.ok(orderService.listByCustomer(customerId));
    }
}
