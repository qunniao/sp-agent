import { Modal } from "ant-design-vue";
import { ExclamationCircleOutlined } from "@ant-design/icons-vue";
import { h } from "vue";

export interface ConfirmOptions {
  /** 弹窗标题 */
  title: string;
  /** 弹窗内容 */
  content?: string;
  /** 确认按钮文字，默认"确认" */
  okText?: string;
  /** 取消按钮文字，默认"取消" */
  cancelText?: string;
  /** 是否危险操作（确认按钮变红），默认 false */
  danger?: boolean;
  /** 确认图标，默认 ExclamationCircleOutlined */
  icon?: typeof ExclamationCircleOutlined;
}

/**
 * 通用二次确认弹窗 composable
 *
 * @returns Promise — 用户点击确认 resolve true，取消 resolve false
 *
 * @example
 * ```ts
 * const { confirm } = useConfirm();
 * const ok = await confirm({ title: '确认删除用户「张三」？', content: '删除后不可恢复', danger: true });
 * if (ok) { ... }
 * ```
 */
export function useConfirm() {
  function confirm(options: ConfirmOptions): Promise<boolean> {
    return new Promise((resolve) => {
      Modal.confirm({
        title: options.title,
        content: options.content || "",
        icon: h(options.icon || ExclamationCircleOutlined, {
          style: options.danger ? "color:#ff4d4f" : "color:#faad14",
        }),
        okText: options.okText || "确认",
        cancelText: options.cancelText || "取消",
        okType: options.danger ? "danger" : "primary",
        onOk: () => resolve(true),
        onCancel: () => resolve(false),
      });
    });
  }

  return { confirm };
}
