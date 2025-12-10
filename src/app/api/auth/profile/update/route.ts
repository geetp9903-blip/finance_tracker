
import { NextResponse } from 'next/server';
import { UserModel } from '@/lib/models';
import dbConnect from '@/lib/db';
import { verifyAccessToken } from '@/lib/auth-jwt';
import { verifyEmailOTP } from '@/lib/otp';
import crypto from 'crypto';

function hashPin(pin: string | number): string {
    return crypto.createHash('sha256').update(String(pin)).digest('hex');
}

export async function POST(request: Request) {
    try {
        await dbConnect();

        // 1. Auth Check (Access Token)
        // We verify token manually here to get the userId securely or rely on Middleware headers.
        // Middleware sets 'x-user-id'. Let's verify token again for max security on critical actions.
        const cookieStore = request.headers.get('cookie') || '';
        const tokenMatch = cookieStore.match(/accessToken=([^;]+)/);
        const accessToken = tokenMatch ? tokenMatch[1] : null;

        if (!accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const payload = await verifyAccessToken(accessToken);
        if (!payload || !payload.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const user = await UserModel.findById(payload.userId);
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        const { type, value, authorization } = await request.json();

        // LOGIC SWITCH
        switch (type) {
            case 'email':
                // REQ: Update Email with PIN required
                const hashedAuthPin = hashPin(authorization);
                if (user.pin !== hashedAuthPin) {
                    return NextResponse.json({ error: 'Invalid PIN' }, { status: 403 });
                }

                // Check if email taken
                const existingEmail = await UserModel.findOne({ email: value });
                if (existingEmail) return NextResponse.json({ error: 'Email already exists' }, { status: 400 });

                user.email = value;
                await user.save();
                return NextResponse.json({ success: true, message: 'Email updated successfully' });

            case 'username':
                // REQ: Update Username 3 updates per week
                // Check Limit
                const now = Date.now();
                const oneWeek = 7 * 24 * 60 * 60 * 1000;

                // Initialize if missing
                if (!user.usernameUpdates) {
                    user.usernameUpdates = { count: 0, lastReset: now };
                }

                // Reset logic
                if (now - user.usernameUpdates.lastReset > oneWeek) {
                    user.usernameUpdates.count = 0;
                    user.usernameUpdates.lastReset = now;
                }

                if (user.usernameUpdates.count >= 3) {
                    return NextResponse.json({ error: 'Weekly update limit reached (3/week)' }, { status: 429 });
                }

                // Check Uniqueness
                const existingUser = await UserModel.findOne({ username: value });
                if (existingUser) return NextResponse.json({ error: 'Username taken' }, { status: 400 });

                user.username = value;
                user.usernameUpdates.count += 1;
                await user.save();
                return NextResponse.json({ success: true, message: 'Username updated successfully' });

            case 'pin':
                // REQ: Update PIN with OTP required
                // Verify DB OTP
                if (!user.otp || !user.otp.code || !user.otp.expires) {
                    return NextResponse.json({ error: 'No OTP requested' }, { status: 400 });
                }
                if (Date.now() > user.otp.expires) {
                    user.otp = undefined; await user.save();
                    return NextResponse.json({ error: 'OTP expired' }, { status: 400 });
                }
                if (user.otp.code !== authorization) { // 'authorization' is the OTP code here
                    return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 });
                }

                // Valid -> Update PIN
                user.pin = hashPin(value); // 'value' is new PIN
                user.otp = undefined; // Clear OTP
                await user.save();
                return NextResponse.json({ success: true, message: 'PIN updated successfully' });

            default:
                return NextResponse.json({ error: 'Invalid update type' }, { status: 400 });
        }

    } catch (error) {
        console.error('Profile Update error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
