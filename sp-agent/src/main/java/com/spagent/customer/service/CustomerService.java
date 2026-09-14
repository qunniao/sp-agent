package com.spagent.customer.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.spagent.customer.entity.Customer;
import com.spagent.customer.mapper.CustomerMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.stereotype.Service;

/**
 * 客户识别服务：按手机号识别新老客户，新客用大模型生成画像标签。
 */
@Service
@RequiredArgsConstructor
public class CustomerService {

    private static final String TAG_PROMPT = """
            根据以下客户信息生成 3~5 个画像标签（如：价格敏感、复购、售后较多、高价值），
            用逗号分隔，只输出标签本身。
            姓名：%s，来源渠道：%s
            """;

    private final CustomerMapper customerMapper;
    private final ChatModel chatModel;

    public Customer identify(String name, String phone, String wechat) {
        Customer customer = customerMapper.selectOne(
                new LambdaQueryWrapper<Customer>().eq(Customer::getPhone, phone));
        if (customer != null) {
            return customer;
        }
        Customer fresh = new Customer();
        fresh.setName(name);
        fresh.setPhone(phone);
        fresh.setWechat(wechat);
        fresh.setIsNew(true);
        fresh.setTags(generateTags(name, wechat));
        customerMapper.insert(fresh);
        return fresh;
    }

    public Customer getById(Long id) {
        return customerMapper.selectById(id);
    }

    private String generateTags(String name, String channel) {
        try {
            return chatModel.call(TAG_PROMPT.formatted(name == null ? "" : name, channel == null ? "" : channel)).trim();
        } catch (Exception e) {
            return "";
        }
    }
}
