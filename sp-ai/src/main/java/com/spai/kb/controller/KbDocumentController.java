package com.spai.kb.controller;

import com.spai.common.api.ApiResponse;
import com.spai.kb.entity.KbDocument;
import com.spai.kb.service.KbDocumentService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 知识文档管理。
 */
@RestController
@RequestMapping("/api/kb/documents")
@RequiredArgsConstructor
public class KbDocumentController {

    private final KbDocumentService service;

    @GetMapping
    public ApiResponse<List<KbDocument>> list(@RequestParam(required = false) Long categoryId) {
        if (categoryId == null) {
            return ApiResponse.ok(service.list());
        }
        return ApiResponse.ok(service.lambdaQuery()
                .eq(KbDocument::getCategoryId, categoryId)
                .list());
    }

    @GetMapping("/{id}")
    public ApiResponse<KbDocument> get(@PathVariable Long id) {
        return ApiResponse.ok(service.getById(id));
    }

    @PostMapping
    public ApiResponse<KbDocument> create(@RequestBody KbDocument doc) {
        return ApiResponse.ok(service.create(doc));
    }

    @PutMapping("/{id}")
    public ApiResponse<KbDocument> update(@PathVariable Long id, @RequestBody KbDocument doc) {
        doc.setId(id);
        // 内容可能变化，标记待重新向量化
        doc.setStatus(0);
        service.updateById(doc);
        return ApiResponse.ok(doc);
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        service.removeById(id);
        return ApiResponse.ok();
    }

    /** 触发向量化入库 */
    @PostMapping("/{id}/vectorize")
    public ApiResponse<Integer> vectorize(@PathVariable Long id) {
        return ApiResponse.ok(service.vectorize(id));
    }
}
