
type RateLimitConfig = {
    interval: number; // in milliseconds
    limit: number;
};

const RULES: Record<string, RateLimitConfig> = {
    auth: { interval: 15 * 60 * 1000, limit: 20 }, // 20 requests per 15 minutes
    data: { interval: 60 * 1000, limit: 100 },      // 100 requests per minute
};

const TRACKERS: Record<string, Map<string, { count: number; expiresAt: number }>> = {
    auth: new Map(),
    data: new Map(),
};

export function checkRateLimit(ip: string, type: 'auth' | 'data'): { success: boolean; limit?: number; remaining?: number; reset?: number } {
    const config = RULES[type];
    const tracker = TRACKERS[type];
    const now = Date.now();

    const record = tracker.get(ip);

    if (!record || now > record.expiresAt) {
        // New window or expired
        tracker.set(ip, { count: 1, expiresAt: now + config.interval });
        return { success: true, limit: config.limit, remaining: config.limit - 1, reset: now + config.interval };
    }

    // Existing window
    if (record.count >= config.limit) {
        return { success: false, limit: config.limit, remaining: 0, reset: record.expiresAt };
    }

    record.count++;
    return { success: true, limit: config.limit, remaining: config.limit - record.count, reset: record.expiresAt };
}

// Cleanup helper to prevent memory leak (optional, but good for long running processes)
setInterval(() => {
    const now = Date.now();
    for (const key of Object.keys(TRACKERS)) {
        const map = TRACKERS[key];
        for (const [ip, record] of map.entries()) {
            if (now > record.expiresAt) {
                map.delete(ip);
            }
        }
    }
}, 60 * 60 * 1000); // Clean up every hour
