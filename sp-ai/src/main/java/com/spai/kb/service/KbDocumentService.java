package com.spai.kb.service;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.spai.common.exception.BizException;
import com.spai.kb.entity.KbDocument;
import com.spai.kb.mapper.KbDocumentMapper;
import org.springframework.stereotype.Service;

/**
 * 知识文档服务：文档 CRUD + 向量化入库。
 */
@Service
public class KbDocumentService extends ServiceImpl<KbDocumentMapper, KbDocument> {

    private final VectorIndexService vectorIndexService;

    public KbDocumentService(VectorIndexService vectorIndexService) {
        this.vectorIndexService = vectorIndexService;
    }

    public KbDocument create(KbDocument doc) {
        doc.setStatus(0);
        save(doc);
        return doc;
    }

    /**
     * 将文档切块向量化写入 PGVector，成功后置状态为「已向量化」。
     *
     * @return 写入的向量条数
     */
    public int vectorize(Long id) {
        KbDocument doc = getById(id);
        if (doc == null) {
            throw new BizException(404, "文档不存在");
        }
        int count = vectorIndexService.index(doc);
        doc.setStatus(1);
        updateById(doc);
        return count;
    }

    @Override
    public boolean removeById(java.io.Serializable id) {
        KbDocument doc = getById(id);
        if (doc != null) {
            vectorIndexService.remove(doc);
        }
        return super.removeById(id);
    }
}
