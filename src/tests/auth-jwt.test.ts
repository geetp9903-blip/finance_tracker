
import { signSessionToken, verifySessionToken } from '../lib/auth-jwt';

describe('JWT Auth', () => {
    it('should sign and verify a session token', async () => {
        const payload = { userId: '123', username: 'testuser' };
        const token = await signSessionToken(payload);
        expect(token).toBeDefined();
        expect(typeof token).toBe('string');

        const decoded = await verifySessionToken(token);
        expect(decoded).toBeDefined();
        expect(decoded?.userId).toBe(payload.userId);
        expect(decoded?.username).toBe(payload.username);
    });

    it('should return null for invalid tokens', async () => {
        const result = await verifySessionToken('invalid-token');
        expect(result).toBeNull();
    });
});
