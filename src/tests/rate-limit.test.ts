
import { checkRateLimit } from '../lib/rate-limit';

describe('Rate Limiter', () => {
    const IP = '127.0.0.1';

    beforeEach(() => {
        // Reset isn't easily possible with the current module implementation for tests 
        // without exporting the map or resetting it. 
        // We will test the logic by using different IPs for different tests.
    });

    it('should allow requests within limit (Auth)', () => {
        const testIp = '1.1.1.1';
        for (let i = 0; i < 20; i++) {
            const result = checkRateLimit(testIp, 'auth');
            expect(result.success).toBe(true);
            expect(result.remaining).toBe(20 - 1 - i);
        }
    });

    it('should block requests over limit (Auth)', () => {
        const testIp = '2.2.2.2';
        // Consume all
        for (let i = 0; i < 20; i++) {
            checkRateLimit(testIp, 'auth');
        }
        // Next one fails
        const result = checkRateLimit(testIp, 'auth');
        expect(result.success).toBe(false);
        expect(result.remaining).toBe(0);
    });

    it('should have different limits for Data', () => {
        const testIp = '3.3.3.3';
        // Consume 20 (auth limit)
        for (let i = 0; i < 20; i++) {
            checkRateLimit(testIp, 'data');
        }
        // Should still succeed because data limit is 100
        const result = checkRateLimit(testIp, 'data');
        expect(result.success).toBe(true);
    });
});
