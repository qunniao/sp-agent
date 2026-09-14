package com.sp.base.framework.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;
import java.util.concurrent.ThreadPoolExecutor;

/**
 * 异步任务全局配置
 * <p>
 * 定义有限线程池替代 Spring 默认的 SimpleAsyncTaskExecutor，
 * 避免高并发下无限创建线程导致 OOM。
 */
@Slf4j
@Configuration
@EnableAsync
public class AsyncConfig {

    /**
     * 日志异步写入专用线程池
     * <ul>
     *   <li>核心线程 2 / 最大 4，适配单机部署</li>
     *   <li>队列容量 1000，溢满时由调用线程执行（CallerRunsPolicy）</li>
     *   <li>拒绝时打印 WARN 日志便于监控</li>
     * </ul>
     */
    @Bean("logExecutor")
    public Executor logExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(2);
        executor.setMaxPoolSize(4);
        executor.setQueueCapacity(1000);
        executor.setKeepAliveSeconds(60);
        executor.setThreadNamePrefix("log-async-");
        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
        executor.setWaitForTasksToCompleteOnShutdown(true);
        executor.setAwaitTerminationSeconds(30);
        executor.initialize();
        log.info("logExecutor 线程池已初始化: core=2, max=4, queue=1000");
        return executor;
    }
}
