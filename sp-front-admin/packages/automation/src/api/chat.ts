/**
 * 虚拟员工对话 API 层：对接 sp-ai 后端 /api/chat/message
 *
 * 后端统一响应 ApiResponse{code,message,data}，code=0 成功；
 * @sp/core 的 http 拦截器已处理错误（非 0 弹出提示并 reject），这里直接返回响应体里的 data。
 */
import { http } from "@sp/core";

export interface ChatReply {
  /** 员工回复正文 */
  answer: string;
  /** 命中的知识库来源标题 */
  references: string[];
}

/** 同一员工的会话 id 固定，便于后端保留多轮上下文 */
export function employeeSessionId(employeeId: string): string {
  return `virtual-${employeeId}`;
}

/**
 * 以指定虚拟员工身份提问。
 *
 * employeeId 只是「以谁的身份说话」，可挂载的技能由后端白名单裁定，
 * 前端传什么都不会扩大权限。
 */
export async function chatWithEmployee(
  employeeId: string,
  message: string,
  sessionId = employeeSessionId(employeeId)
): Promise<ChatReply> {
  const res = await http.post("/chat/message", { employeeId, message, sessionId });
  return res.data.data;
}
