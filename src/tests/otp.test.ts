
import { generateEmailOTP, storeOTP, verifyEmailOTP } from '../lib/otp';

describe('OTP Auth', () => {
    it('should generate a 6-digit OTP', () => {
        const otp = generateEmailOTP();
        expect(otp).toHaveLength(6);
        expect(/^\d+$/.test(otp)).toBe(true);
    });

    it('should store and verify an OTP', () => {
        const userId = 'user123';
        const otp = generateEmailOTP();

        storeOTP(userId, otp);

        const isValid = verifyEmailOTP(userId, otp);
        expect(isValid).toBe(true);
    });

    it('should reject invalid OTP', () => {
        const userId = 'user456';
        const otp = generateEmailOTP();

        storeOTP(userId, otp);

        const isValid = verifyEmailOTP(userId, '000000');
        expect(isValid).toBe(false);
    });

    it('should reject OTP after verification (one-time use)', () => {
        const userId = 'user789';
        const otp = generateEmailOTP();

        storeOTP(userId, otp);
        verifyEmailOTP(userId, otp);

        const isValidRetry = verifyEmailOTP(userId, otp);
        expect(isValidRetry).toBe(false);
    });
});
