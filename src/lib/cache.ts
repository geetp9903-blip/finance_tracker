type CacheEntry<T> = {
    data: T;
    timestamp: number;
};

const cache = new Map<string, CacheEntry<any>>();
const TTL = 60 * 1000; // 1 minute default TTL

export const cacheService = {
    get: <T>(key: string): T | null => {
        const entry = cache.get(key);
        if (!entry) return null;

        if (Date.now() - entry.timestamp > TTL) {
            cache.delete(key);
            return null;
        }

        return entry.data;
    },

    set: <T>(key: string, data: T): void => {
        cache.set(key, {
            data,
            timestamp: Date.now()
        });
    },

    invalidate: (key: string): void => {
        cache.delete(key);
    },

    invalidatePattern: (pattern: string): void => {
        for (const key of cache.keys()) {
            if (key.includes(pattern)) {
                cache.delete(key);
            }
        }
    },

    clear: (): void => {
        cache.clear();
    }
};
