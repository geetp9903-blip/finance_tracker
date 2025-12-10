
import { NextResponse } from 'next/server';
import { UserModel } from '@/lib/models';
import dbConnect from '@/lib/db';
import { verifyEmailOTP } from '@/lib/otp';
import { signAccessToken, signRefreshToken } from '@/lib/auth-jwt';
import crypto from 'crypto';

export async function POST(request: Request) {
    try {
        await dbConnect();
        const { username, code, newPin } = await request.json();
        console.log(`[OTP Verify] Request for ${username}. Code provided. NewPin provided: ${!!newPin}`);

        const user = await UserModel.findOne({ username });
        if (!user) {
            console.log('[OTP Verify] User not found.');
            return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
        }

        // Verify OTP
        // Verify OTP from Database
        if (!user.otp || !user.otp.code || !user.otp.expires) {
            console.log('[OTP Verify] No OTP found on user record.');
            return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 400 });
        }

        if (Date.now() > user.otp.expires) {
            console.log('[OTP Verify] OTP expired.');
            user.otp = undefined; // Clear expired
            await user.save();
            return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 400 });
        }

        if (user.otp.code !== code) {
            console.log('[OTP Verify] Code mismatch.');
            return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 400 });
        }

        // Valid OTP - Clear it
        user.otp = undefined;
        await user.save();

        // Action: Reset PIN (Mandatory now)
        if (!newPin) {
            console.log('[OTP Verify] Missing newPin. Login-only via OTP is disabled.');
            return NextResponse.json({ error: 'New PIN is required to reset.' }, { status: 400 });
        }

        console.log('[OTP Verify] Updating PIN...');
        user.pin = crypto.createHash('sha256').update(String(newPin)).digest('hex');
        await user.save();
        console.log('[OTP Verify] PIN updated.');

        // Auto-login (Issue tokens)
        const accessToken = await signAccessToken({ userId: user.id, username: user.username });
        const refreshToken = await signRefreshToken({ userId: user.id, username: user.username });

        user.refreshToken = refreshToken;
        await user.save();

        const response = NextResponse.json({ success: true });

        response.cookies.set('accessToken', accessToken, {
            httpOnly: true,
            secure: false, // process.env.NODE_ENV === 'production', // Reverted for local network testing
            sameSite: 'lax',
            path: '/',
            maxAge: 15 * 60
        });

        response.cookies.set('refreshToken', refreshToken, {
            httpOnly: true,
            secure: false, // process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 7 * 24 * 60 * 60
        });

        return response;

    } catch (error) {
        console.error('OTP Verify error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
