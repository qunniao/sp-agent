package com.sp.base.log.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.sp.base.log.dto.LogQueryDTO;
import com.sp.base.log.entity.LoginLog;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

/**
 * 登录日志 Mapper
 */
@Mapper
public interface LoginLogMapper extends BaseMapper<LoginLog> {

    /**
     * 分页查询登录日志（返回 Entity，去掉了冗余 VO）
     */
    @Select("""
        <script>
        SELECT id, username, ip, browser, os, status, error_msg, login_time
        FROM t_login_log
        <where>
            <if test='query.username != null and query.username != \"\"'>
                AND username LIKE CONCAT('%', #{query.username}, '%')
            </if>
            <if test='query.status != null'>
                AND status = #{query.status}
            </if>
            <if test='query.startTime != null'>
                AND login_time &gt;= #{query.startTime}
            </if>
            <if test='query.endTime != null'>
                AND login_time &lt;= #{query.endTime}
            </if>
        </where>
        ORDER BY login_time DESC
        </script>
    """)
    Page<LoginLog> selectPageWithQuery(Page<?> page, @Param("query") LogQueryDTO query);
}
