/**
 * Performance Optimization Utilities
 * Caching, lazy loading, and optimization helpers for ConvertFlow AI
 */

// In-memory cache (use Redis in production)
const cache = new Map();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

/**
 * Cache wrapper for expensive operations
 */
export function withCache(key, ttl = CACHE_TTL) {
    return async function (fn) {
        const cached = cache.get(key);

        if (cached && Date.now() - cached.timestamp < ttl) {
            return cached.data;
        }

        const data = await fn();
        cache.set(key, { data, timestamp: Date.now() });

        return data;
    };
}

/**
 * Clear cache by key or pattern
 */
export function clearCache(pattern = null) {
    if (!pattern) {
        cache.clear();
        return;
    }

    for (const key of cache.keys()) {
        if (key.includes(pattern)) {
            cache.delete(key);
        }
    }
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
    return {
        size: cache.size,
        keys: Array.from(cache.keys()),
    };
}

/**
 * Batch database operations
 */
export async function batchQuery(queries, batchSize = 10) {
    const results = [];

    for (let i = 0; i < queries.length; i += batchSize) {
        const batch = queries.slice(i, i + batchSize);
        const batchResults = await Promise.all(batch);
        results.push(...batchResults);
    }

    return results;
}

/**
 * Debounce function for API calls
 */
export function debounce(func, wait) {
    let timeout;

    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };

        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Rate limiter (simple token bucket)
 */
export class RateLimiter {
    constructor(maxRequests, windowMs) {
        this.maxRequests = maxRequests;
        this.windowMs = windowMs;
        this.requests = new Map();
    }

    isAllowed(identifier) {
        const now = Date.now();
        const userRequests = this.requests.get(identifier) || [];

        // Remove old requests outside the window
        const validRequests = userRequests.filter(
            (timestamp) => now - timestamp < this.windowMs
        );

        if (validRequests.length >= this.maxRequests) {
            return false;
        }

        validRequests.push(now);
        this.requests.set(identifier, validRequests);

        return true;
    }

    reset(identifier) {
        this.requests.delete(identifier);
    }
}

/**
 * Image optimization helpers
 */
export const imageOptimization = {
    /**
     * Generate optimized image URL with Shopify CDN parameters
     */
    getOptimizedUrl(imageUrl, options = {}) {
        const { width, height, crop = 'center', format = 'jpg' } = options;

        if (!imageUrl) return null;

        let url = imageUrl;
        const params = [];

        if (width) params.push(`width=${width}`);
        if (height) params.push(`height=${height}`);
        if (crop) params.push(`crop=${crop}`);

        if (params.length > 0) {
            url += (url.includes('?') ? '&' : '?') + params.join('&');
        }

        return url;
    },

    /**
     * Generate srcset for responsive images
     */
    generateSrcSet(imageUrl, widths = [320, 640, 768, 1024, 1280, 1920]) {
        return widths
            .map((width) => `${this.getOptimizedUrl(imageUrl, { width })} ${width}w`)
            .join(', ');
    },
};

/**
 * Lazy loading helper for sections
 */
export function createLazyLoader(threshold = 0.1) {
    if (typeof window === 'undefined') return null;

    return new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    const element = entry.target;
                    const src = element.dataset.src;

                    if (src) {
                        element.src = src;
                        element.removeAttribute('data-src');
                    }

                    element.classList.add('loaded');
                }
            });
        },
        { threshold }
    );
}

/**
 * Preload critical resources
 */
export function preloadResources(resources) {
    if (typeof document === 'undefined') return;

    resources.forEach(({ href, as, type }) => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.href = href;
        link.as = as;
        if (type) link.type = type;

        document.head.appendChild(link);
    });
}

/**
 * Bundle size monitoring
 */
export function logBundleSize(bundleName, sizeInKb) {
    if (process.env.NODE_ENV !== 'production') {
        console.log(`[Bundle] ${bundleName}: ${sizeInKb.toFixed(2)} KB`);
    }
}

/**
 * Performance monitoring
 */
export class PerformanceMonitor {
    constructor() {
        this.marks = new Map();
    }

    start(name) {
        this.marks.set(name, Date.now());
    }

    end(name) {
        const startTime = this.marks.get(name);
        if (!startTime) return null;

        const duration = Date.now() - startTime;
        this.marks.delete(name);

        return duration;
    }

    measure(name, fn) {
        this.start(name);
        const result = fn();
        const duration = this.end(name);

        if (process.env.NODE_ENV !== 'production') {
            console.log(`[Perf] ${name}: ${duration}ms`);
        }

        return result;
    }

    async measureAsync(name, fn) {
        this.start(name);
        const result = await fn();
        const duration = this.end(name);

        if (process.env.NODE_ENV !== 'production') {
            console.log(`[Perf] ${name}: ${duration}ms`);
        }

        return result;
    }
}

export default {
    withCache,
    clearCache,
    getCacheStats,
    batchQuery,
    debounce,
    RateLimiter,
    imageOptimization,
    createLazyLoader,
    preloadResources,
    logBundleSize,
    PerformanceMonitor,
};
