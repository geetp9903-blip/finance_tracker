
import { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken } from '../lib/auth-jwt';

describe('JWT Auth', () => {
    // Helper to delay for expiration testing if needed, but we'll stick to validity checks

    it('should sign and verify an access token', async () => {
        const payload = { userId: '123', username: 'testuser' };
        const token = await signAccessToken(payload);
        expect(token).toBeDefined();
        expect(typeof token).toBe('string');

        const decoded = await verifyAccessToken(token);
        expect(decoded).toBeDefined();
        expect(decoded?.userId).toBe(payload.userId);
        expect(decoded?.username).toBe(payload.username);
    });

    it('should sign and verify a refresh token', async () => {
        const payload = { userId: '123', username: 'testuser' };
        const token = await signRefreshToken(payload);
        expect(token).toBeDefined();

        const decoded = await verifyRefreshToken(token);
        expect(decoded).toBeDefined();
        expect(decoded?.userId).toBe(payload.userId);
    });

    it('should return null for invalid tokens', async () => {
        const result = await verifyAccessToken('invalid-token');
        expect(result).toBeNull();
    });
});
