package com.spai.skill;

/**
 * 技能被安全策略拒绝。
 *
 * <p>只在技能内部流转：调用方捕获后转成对模型友好的拒绝话术，不向接口层抛出。</p>
 */
public class SkillDeniedException extends RuntimeException {

    public SkillDeniedException(String message) {
        super(message);
    }
}
