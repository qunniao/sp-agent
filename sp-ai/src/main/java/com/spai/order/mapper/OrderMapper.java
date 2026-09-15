package com.spai.order.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.spai.order.entity.Order;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.time.LocalDateTime;
import java.util.Map;

public interface OrderMapper extends BaseMapper<Order> {

    /**
     * 按时间区间与状态聚合订单笔数和金额合计。
     *
     * <p>SQL 固定、参数全部走 #{} 预编译，不做任何字符串拼接；deleted 条件需手写，
     * 逻辑删除只对 MyBatis-Plus 自动生成的语句生效。返回 map 而非实体，
     * 规避列名到构造器的映射差异（键：order_count / total_amount）。</p>
     */
    @Select("""
            <script>
            SELECT COUNT(*) AS order_count, COALESCE(SUM(amount), 0) AS total_amount
            FROM orders
            WHERE deleted = 0
              AND create_time &gt;= #{startTime}
              AND create_time &lt; #{endTime}
            <if test="status != null"> AND status = #{status} </if>
            </script>
            """)
    Map<String, Object> sumAmount(@Param("startTime") LocalDateTime startTime,
                                  @Param("endTime") LocalDateTime endTime,
                                  @Param("status") String status);
}
