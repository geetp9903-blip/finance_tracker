
import { NextResponse } from 'next/server';
import { UserModel } from '@/lib/models';
import dbConnect from '@/lib/db';
import { signSessionToken } from '@/lib/auth-jwt';
import crypto from 'crypto';

function hashPin(pin: string | number): string {
    // Legacy hash format (SHA256 hex)
    return crypto.createHash('sha256').update(String(pin)).digest('hex');
}

export async function POST(request: Request) {
    try {
        await dbConnect();
        const { username, pin } = await request.json();

        if (!username || !pin) {
            return NextResponse.json({ error: 'Username and PIN are required' }, { status: 400 });
        }

        const hashedPin = hashPin(pin);
        const user = await UserModel.findOne({ username });

        if (!user || user.pin !== hashedPin) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        // Generate Session Token
        const sessionToken = await signSessionToken({ userId: user.id, username: user.username });

        // We don't necessarily need to store sessionToken in DB unless we want invalidation features.
        // For now, let's keep it simple as requested. We can clear refreshToken to avoid confusion.
        user.refreshToken = "";
        await user.save();

        const response = NextResponse.json({ success: true, user: { id: user.id, username: user.username } });

        // Set Single Session Cookie
        response.cookies.set('sessionToken', sessionToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 7 * 24 * 60 * 60 // 7 Days
        });

        // Clear old cookies just in case
        response.cookies.delete('accessToken');
        response.cookies.delete('refreshToken');

        return response;

    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
