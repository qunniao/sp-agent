/**
 * 知识库 API 层：对接 sp-ai 后端 /api/kb/*
 *
 * 后端统一响应 ApiResponse{code,message,data}，code=0 成功；
 * @sp/core 的 http 拦截器已处理错误（非 0 弹出提示并 reject），
 * 这里直接返回响应体里的 data。
 */
import { http } from "@sp/core";
import type { KnowledgeDoc, KnowledgeCategory } from "../types";

/** 文档列表，可按分类过滤 */
export async function getKnowledgeDocs(categoryId?: number): Promise<KnowledgeDoc[]> {
  const res = await http.get("/kb/documents", { params: { categoryId } });
  return res.data.data;
}

/** 新建文档 */
export async function createKnowledgeDoc(data: Partial<KnowledgeDoc>): Promise<KnowledgeDoc> {
  const res = await http.post("/kb/documents", data);
  return res.data.data;
}

/** 更新文档（后端会重置为「待向量化」） */
export async function updateKnowledgeDoc(id: number, data: Partial<KnowledgeDoc>): Promise<KnowledgeDoc> {
  const res = await http.put(`/kb/documents/${id}`, data);
  return res.data.data;
}

/** 删除文档 */
export async function deleteKnowledgeDoc(id: number): Promise<void> {
  await http.delete(`/kb/documents/${id}`);
}

/** 触发向量化入库，返回写入的向量条数 */
export async function vectorizeDocument(id: number): Promise<number> {
  const res = await http.post(`/kb/documents/${id}/vectorize`);
  return res.data.data;
}

/** 分类列表（后端按 sort、id 升序返回） */
export async function getKnowledgeCategories(): Promise<KnowledgeCategory[]> {
  const res = await http.get("/kb/categories");
  return res.data.data;
}
