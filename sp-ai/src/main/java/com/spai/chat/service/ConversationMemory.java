package com.spai.chat.service;

import org.springframework.stereotype.Component;

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 会话记忆（进程内，多轮对话上下文）。
 *
 * <p>MVP 采用内存实现，每个 session 保留最近 {@link #MAX_TURNS} 条消息；
 * 后续可替换为 Redis / 数据库持久化。</p>
 */
@Component
public class ConversationMemory {

    public record Message(String role, String content) {
    }

    private static final int MAX_TURNS = 10;

    private final Map<String, Deque<Message>> store = new ConcurrentHashMap<>();

    public List<Message> get(String sessionId) {
        return new ArrayList<>(store.getOrDefault(sessionId, new ArrayDeque<>()));
    }

    public void add(String sessionId, String role, String content) {
        Deque<Message> queue = store.computeIfAbsent(sessionId, k -> new ArrayDeque<>());
        queue.addLast(new Message(role, content));
        while (queue.size() > MAX_TURNS) {
            queue.removeFirst();
        }
    }

    public void clear(String sessionId) {
        store.remove(sessionId);
    }
}
