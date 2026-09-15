package com.spai.kb.service;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.spai.kb.entity.KbCategory;
import com.spai.kb.mapper.KbCategoryMapper;
import org.springframework.stereotype.Service;

/**
 * 知识分类服务。
 */
@Service
public class KbCategoryService extends ServiceImpl<KbCategoryMapper, KbCategory> {
}
