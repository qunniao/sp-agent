package com.spagent;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * SP-Agent（超级客服智能体）启动类。
 *
 * <p>AI 客服 + 知识库系统：基于大模型 RAG 的智能客服，
 * 支持智能问答、知识库管理、客户识别/意图分类、订单查询、风险预警转人工。</p>
 */
@SpringBootApplication
@MapperScan("com.spagent.**.mapper")
public class SpAgentApplication {

    public static void main(String[] args) {
        SpringApplication.run(SpAgentApplication.class, args);
    }
}
