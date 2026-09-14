package com.sp.base.log.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.sp.base.log.dto.LogQueryDTO;
import com.sp.base.log.entity.OperationLog;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

/**
 * 操作日志 Mapper
 */
@Mapper
public interface OperationLogMapper extends BaseMapper<OperationLog> {

    /**
     * 分页查询操作日志（返回 Entity，去掉了冗余 VO）
     */
    @Select("""
        <script>
        SELECT id, operator, action, method, path, ip, status, error_msg, cost_time, create_time
        FROM t_operation_log
        <where>
            <if test='query.operator != null and query.operator != \"\"'>
                AND operator LIKE CONCAT('%', #{query.operator}, '%')
            </if>
            <if test='query.action != null and query.action != \"\"'>
                AND action = #{query.action}
            </if>
            <if test='query.method != null and query.method != \"\"'>
                AND method = #{query.method}
            </if>
            <if test='query.status != null'>
                AND status = #{query.status}
            </if>
            <if test='query.startTime != null'>
                AND create_time &gt;= #{query.startTime}
            </if>
            <if test='query.endTime != null'>
                AND create_time &lt;= #{query.endTime}
            </if>
        </where>
        ORDER BY create_time DESC
        </script>
    """)
    Page<OperationLog> selectPageWithQuery(Page<?> page, @Param("query") LogQueryDTO query);
}
