package com.spai.kb.service;

import com.spai.kb.entity.KbDocument;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 向量索引服务：把知识文档切块、向量化并写入 PGVector，检索时按相似度召回。
 *
 * <p>向量 id 约定为 {@code doc-{docId}-{chunkIndex}}，便于按文档删除。</p>
 */
@Service
public class VectorIndexService {

    private static final int CHUNK_SIZE = 500;

    private final VectorStore vectorStore;

    public VectorIndexService(VectorStore vectorStore) {
        this.vectorStore = vectorStore;
    }

    /**
     * 将文档切块并写入向量库，返回写入的向量条数。
     */
    public int index(KbDocument doc) {
        List<Document> chunks = chunk(doc);
        if (chunks.isEmpty()) {
            return 0;
        }
        vectorStore.add(chunks);
        return chunks.size();
    }

    /**
     * 删除文档对应的全部向量。
     */
    public void remove(KbDocument doc) {
        List<String> ids = chunk(doc).stream().map(Document::getId).toList();
        if (!ids.isEmpty()) {
            vectorStore.delete(ids);
        }
    }

    private List<Document> chunk(KbDocument doc) {
        List<Document> result = new ArrayList<>();
        List<String> pieces = split(doc.getContent(), CHUNK_SIZE);
        for (int i = 0; i < pieces.size(); i++) {
            Map<String, Object> metadata = new HashMap<>();
            metadata.put("docId", doc.getId());
            metadata.put("title", doc.getTitle());
            metadata.put("chunk", i);
            Document d = Document.builder()
                    .id("doc-" + doc.getId() + "-" + i)
                    .text(pieces.get(i))
                    .metadata(metadata)
                    .build();
            result.add(d);
        }
        return result;
    }

    private List<String> split(String text, int size) {
        List<String> out = new ArrayList<>();
        if (text == null || text.isBlank()) {
            return out;
        }
        for (int i = 0; i < text.length(); i += size) {
            out.add(text.substring(i, Math.min(text.length(), i + size)));
        }
        return out;
    }
}
