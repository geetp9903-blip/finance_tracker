
import { NextResponse } from 'next/server';
import { UserModel } from '@/lib/models';
import dbConnect from '@/lib/db';
import { signAccessToken, signRefreshToken } from '@/lib/auth-jwt';
import crypto from 'crypto';

function hashPin(pin: string | number): string {
    // Legacy hash format (SHA256 hex) - if changing to bcrypt, need migration or check
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

        // Generate Tokens
        const accessToken = await signAccessToken({ userId: user.id, username: user.username });
        const refreshToken = await signRefreshToken({ userId: user.id, username: user.username });

        // Update User with Refresh Token (Rotation)
        user.refreshToken = refreshToken;
        await user.save();

        const response = NextResponse.json({ success: true, user: { id: user.id, username: user.username } });

        // Set Cookies
        response.cookies.set('accessToken', accessToken, {
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
            path: '/',
            maxAge: 15 * 60
        });

        response.cookies.set('refreshToken', refreshToken, {
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
            path: '/',
            maxAge: 7 * 24 * 60 * 60
        });

        return response;

    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
