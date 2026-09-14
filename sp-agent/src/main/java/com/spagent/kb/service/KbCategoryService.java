package com.spagent.kb.service;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.spagent.kb.entity.KbCategory;
import com.spagent.kb.mapper.KbCategoryMapper;
import org.springframework.stereotype.Service;

/**
 * 知识分类服务。
 */
@Service
public class KbCategoryService extends ServiceImpl<KbCategoryMapper, KbCategory> {
}
