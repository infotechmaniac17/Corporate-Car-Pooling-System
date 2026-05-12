package com.carpooling.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Component
@Order(1)
public class AuthRateLimitFilter extends OncePerRequestFilter {

    private static final long WINDOW_MS = 15 * 60 * 1000L;
    private static final int DEFAULT_LIMIT = 20;
    private static final int STRICT_LIMIT = 5;
    private static final Set<String> STRICT_PATHS = Set.of("/auth/send-otp", "/auth/verify-otp");

    private final ConcurrentHashMap<String, Deque<Long>> ipTimestamps = new ConcurrentHashMap<>();

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
        String path = request.getServletPath();
        if (!path.startsWith("/auth/")) {
            chain.doFilter(request, response);
            return;
        }

        String ip = getClientIp(request);
        boolean strict = STRICT_PATHS.contains(path);
        int limit = strict ? STRICT_LIMIT : DEFAULT_LIMIT;
        String key = ip + ":" + (strict ? path : "auth");

        long now = System.currentTimeMillis();
        Deque<Long> timestamps = ipTimestamps.computeIfAbsent(key, k -> new ArrayDeque<>());
        synchronized (timestamps) {
            timestamps.removeIf(t -> now - t > WINDOW_MS);
            if (timestamps.size() >= limit) {
                response.setStatus(429);
                response.setContentType("application/json");
                response.getWriter().write("{\"error\":\"Too many requests. Please try again later.\"}");
                return;
            }
            timestamps.addLast(now);
        }
        chain.doFilter(request, response);
    }

    private String getClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) return forwarded.split(",")[0].trim();
        return request.getRemoteAddr();
    }
}
