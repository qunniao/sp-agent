package com.spai.skill;

import java.util.Set;

/**
 * 虚拟员工的技能画像：决定该员工使用哪套人设提示词、可挂载哪些技能。
 *
 * @param id           员工标识，与前端虚拟员工 id 一致
 * @param name         员工名称
 * @param systemPrompt 人设提示词
 * @param skills       已授权技能标识集合，未列出的技能对模型不可见
 */
public record EmployeeProfile(String id, String name, String systemPrompt, Set<String> skills) {
}
