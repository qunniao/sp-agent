package com.sp.base.common;

import lombok.Data;

/**
 * 分页请求参数基类
 * <p>
 * Controller 接收的分页参数继承此类，Service 层可直接读取 page/pageSize/sortField/sortOrder。
 */
@Data
public class PageParams {

    /** 当前页码（从 1 开始） */
    private long page = 1;

    /** 每页条数 */
    private long pageSize = 10;

    /** 排序字段 */
    private String sortField;

    /** 排序方向 ascend / descend */
    private String sortOrder;
}
