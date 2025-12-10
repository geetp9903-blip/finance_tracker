
import { authenticator } from 'otplib';
import nodemailer from 'nodemailer';
import QRCode from 'qrcode';

// Configure Nodemailer
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

export function generateTOTPSecret(username: string) {
    const secret = authenticator.generateSecret();
    const otpauth = authenticator.keyuri(username, 'FinanceTracker', secret);
    return { secret, otpauth };
}

export async function generateQRCode(otpauth: string) {
    return await QRCode.toDataURL(otpauth);
}

export function verifyTOTP(token: string, secret: string) {
    return authenticator.check(token, secret);
}

// Simple in-memory store for Email OTPs (In prod, use Redis or DB with TTL)
// Key: email/userId, Value: { code, expires }
const otpStore = new Map<string, { code: string; expires: number }>();

export function generateEmailOTP() {
    return authenticator.generate(authenticator.generateSecret()).slice(0, 6); // Simple 6 digit
}

export async function sendEmailOTP(email: string, code: string) {
    if (!process.env.SMTP_USER) {
        console.warn('SMTP_USER not set. OTP not sent. Code:', code);
        return; // Dev mode: just log it
    }

    await transporter.sendMail({
        from: '"Prospera Finance" <noreply@prospera.com>',
        to: email,
        subject: 'Authentication Code - Prospera',
        text: `Prospera - Track your spending, Plan your Finances.\n\nYour OTP code is: ${code}.\n\nIt expires in 5 minutes.`,
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; padding: 20px; border-radius: 10px;">
            <div style="text-align: center; margin-bottom: 20px;">
                <h1 style="color: #111827; margin: 0; font-size: 24px;">Prospera</h1>
                <p style="color: #6b7280; font-size: 14px; margin-top: 5px;">Track your spending, Plan your Finances.</p>
            </div>
            <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); text-align: center;">
                <p style="color: #374151; font-size: 16px; margin-bottom: 20px;">Use the code below to complete your authentication:</p>
                <div style="background-color: #f3f4f6; display: inline-block; padding: 15px 30px; border-radius: 6px; letter-spacing: 5px; font-weight: bold; font-size: 32px; color: #4f46e5;">
                    ${code}
                </div>
                <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">This code expires in 5 minutes.</p>
            </div>
            <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
                &copy; ${new Date().getFullYear()} Prospera Finance Tracker. Keep this code secure.
            </div>
        </div>
        `,
    });
}

export function storeOTP(identifier: string, code: string) {
    const expires = Date.now() + 5 * 60 * 1000; // 5 mins
    otpStore.set(identifier, { code, expires });
}

export function verifyEmailOTP(identifier: string, code: string) {
    const entry = otpStore.get(identifier);
    if (!entry) return false;
    if (Date.now() > entry.expires) {
        otpStore.delete(identifier);
        return false;
    }
    if (entry.code === code) {
        otpStore.delete(identifier);
        return true;
    }
    return false;
}
