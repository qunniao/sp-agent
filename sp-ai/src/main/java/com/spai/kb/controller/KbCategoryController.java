package com.spai.kb.controller;

import com.spai.common.api.ApiResponse;
import com.spai.kb.entity.KbCategory;
import com.spai.kb.service.KbCategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 知识分类管理。
 */
@RestController
@RequestMapping("/api/kb/categories")
@RequiredArgsConstructor
public class KbCategoryController {

    private final KbCategoryService service;

    @GetMapping
    public ApiResponse<List<KbCategory>> list() {
        return ApiResponse.ok(service.lambdaQuery()
                .orderByAsc(KbCategory::getSort)
                .orderByAsc(KbCategory::getId)
                .list());
    }

    @GetMapping("/{id}")
    public ApiResponse<KbCategory> get(@PathVariable Long id) {
        return ApiResponse.ok(service.getById(id));
    }

    @PostMapping
    public ApiResponse<KbCategory> create(@RequestBody KbCategory category) {
        service.save(category);
        return ApiResponse.ok(category);
    }

    @PutMapping("/{id}")
    public ApiResponse<KbCategory> update(@PathVariable Long id, @RequestBody KbCategory category) {
        category.setId(id);
        service.updateById(category);
        return ApiResponse.ok(category);
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        service.removeById(id);
        return ApiResponse.ok();
    }
}
