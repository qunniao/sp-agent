package com.spagent.customer.controller;

import com.spagent.common.api.ApiResponse;
import com.spagent.customer.entity.Customer;
import com.spagent.customer.service.CustomerService;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 客户识别入口。
 */
@RestController
@RequestMapping("/api/customer")
@RequiredArgsConstructor
public class CustomerController {

    public record IdentifyRequest(
            String name,
            @NotBlank(message = "手机号不能为空") String phone,
            String wechat
    ) {
    }

    private final CustomerService customerService;

    @PostMapping("/identify")
    public ApiResponse<Customer> identify(@RequestBody IdentifyRequest request) {
        return ApiResponse.ok(customerService.identify(request.name(), request.phone(), request.wechat()));
    }

    @GetMapping("/{id}")
    public ApiResponse<Customer> get(@PathVariable Long id) {
        return ApiResponse.ok(customerService.getById(id));
    }
}
