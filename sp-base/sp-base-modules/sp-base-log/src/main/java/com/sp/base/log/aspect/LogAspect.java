package com.sp.base.log.aspect;

import com.sp.base.framework.security.OperatorProvider;
import com.sp.base.log.annotation.OperationLog;
import com.sp.base.log.service.LogService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.core.annotation.AnnotatedElementUtils;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.lang.reflect.Method;
import java.time.LocalDateTime;

/**
 * 操作日志 AOP 切面
 * <p>
 * 拦截带有 @OperationLog 注解的 Controller 方法，
 * 在方法执行完成后异步记录操作日志（成功/失败状态 + 耗时）。
 */
@Slf4j
@Aspect
@Component
@RequiredArgsConstructor
public class LogAspect {

    private final LogService logService;
    private final OperatorProvider operatorProvider;

    @Around("@annotation(com.sp.base.log.annotation.OperationLog)")
    public Object around(ProceedingJoinPoint joinPoint) throws Throwable {
        long start = System.currentTimeMillis();

        // ---- 解析注解参数 ----
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        Method method = signature.getMethod();
        OperationLog ann = method.getAnnotation(OperationLog.class);

        String action = resolveAction(ann);
        String reqMethod = resolveMethod(ann, method);
        String reqPath = resolvePath(ann, method);
        String operator = operatorProvider.getCurrentOperator();
        String ip = getClientIp();

        Integer status = 1;
        String errorMsg = null;

        try {
            return joinPoint.proceed();
        } catch (Throwable e) {
            status = 0;
            errorMsg = e.getMessage();
            throw e;
        } finally {
            long costTime = System.currentTimeMillis() - start;
            com.sp.base.log.entity.OperationLog logEntry = com.sp.base.log.entity.OperationLog.builder()
                    .operator(operator)
                    .action(action)
                    .method(reqMethod)
                    .path(reqPath)
                    .ip(ip)
                    .status(status)
                    .errorMsg(errorMsg)
                    .costTime(costTime)
                    .createTime(LocalDateTime.now())
                    .build();
            logService.recordOperationLog(logEntry);
        }
    }

    /**
     * 解析 action：优先 value()，其次 action()
     */
    private String resolveAction(OperationLog ann) {
        if (!ann.value().isEmpty()) return ann.value();
        return ann.action();
    }

    /**
     * 解析 HTTP method：注解指定 > @RequestMapping 派生 > "UNKNOWN"
     */
    private String resolveMethod(OperationLog ann, Method method) {
        if (!ann.method().isEmpty()) return ann.method();
        return deriveHttpMethod(method);
    }

    /**
     * 解析请求路径：注解指定 > @RequestMapping 派生 > ""
     */
    private String resolvePath(OperationLog ann, Method method) {
        if (!ann.path().isEmpty()) return ann.path();
        return derivePath(method);
    }

    // ---- HTTP method 派生 ----

    private String deriveHttpMethod(Method method) {
        if (method.isAnnotationPresent(GetMapping.class)) return "GET";
        if (method.isAnnotationPresent(PostMapping.class)) return "POST";
        if (method.isAnnotationPresent(PutMapping.class)) return "PUT";
        if (method.isAnnotationPresent(DeleteMapping.class)) return "DELETE";
        if (method.isAnnotationPresent(PatchMapping.class)) return "PATCH";

        RequestMapping rm = AnnotatedElementUtils.findMergedAnnotation(method, RequestMapping.class);
        if (rm != null && rm.method().length > 0) {
            return rm.method()[0].name();
        }
        return "UNKNOWN";
    }

    // ---- 路径派生 ----

    private String derivePath(Method method) {
        // 方法级路径 + 类级路径拼接
        String classPath = "";
        RequestMapping classRm = AnnotatedElementUtils.findMergedAnnotation(
                method.getDeclaringClass(), RequestMapping.class);
        if (classRm != null && classRm.value().length > 0) {
            classPath = classRm.value()[0];
        }

        // 从具体 Mapping 注解获取路径
        String methodPath = extractMappingValue(method);
        if (methodPath.isEmpty()) {
            // fallback 到 @RequestMapping
            RequestMapping rm = AnnotatedElementUtils.findMergedAnnotation(method, RequestMapping.class);
            if (rm != null && rm.value().length > 0) {
                methodPath = rm.value()[0];
            }
        }

        return normalizePath(classPath + methodPath);
    }

    private String extractMappingValue(Method method) {
        GetMapping gm = method.getAnnotation(GetMapping.class);
        if (gm != null && gm.value().length > 0) return gm.value()[0];
        PostMapping pm = method.getAnnotation(PostMapping.class);
        if (pm != null && pm.value().length > 0) return pm.value()[0];
        PutMapping pum = method.getAnnotation(PutMapping.class);
        if (pum != null && pum.value().length > 0) return pum.value()[0];
        DeleteMapping dm = method.getAnnotation(DeleteMapping.class);
        if (dm != null && dm.value().length > 0) return dm.value()[0];
        PatchMapping pam = method.getAnnotation(PatchMapping.class);
        if (pam != null && pam.value().length > 0) return pam.value()[0];
        return "";
    }

    private String normalizePath(String path) {
        if (path.isEmpty()) return "/";
        return path.replaceAll("/+", "/");
    }

    // ---- IP 获取 ----

    private String getClientIp() {
        try {
            ServletRequestAttributes attrs =
                    (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attrs == null) return "unknown";
            HttpServletRequest request = attrs.getRequest();

            String ip = request.getHeader("X-Forwarded-For");
            if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
                ip = request.getHeader("X-Real-IP");
            }
            if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
                ip = request.getRemoteAddr();
            }
            if (ip != null && ip.contains(",")) {
                ip = ip.split(",")[0].trim();
            }
            return ip;
        } catch (Exception e) {
            return "unknown";
        }
    }
}
