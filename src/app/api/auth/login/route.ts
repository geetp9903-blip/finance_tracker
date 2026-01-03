import { NextResponse } from 'next/server';
import { UserModel } from '@/lib/models';
import dbConnect from '@/lib/db';
import { signSessionToken } from '@/lib/auth-jwt';
import crypto from 'crypto';
import { LoginSchema } from '@/lib/schemas';

function hashPin(pin: string | number): string {
    return crypto.createHash('sha256').update(String(pin)).digest('hex');
}

export async function POST(request: Request) {
    try {
        await dbConnect();
        const body = await request.json();

        // 1. Zod Validation
        const validation = LoginSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({
                error: 'Invalid input',
                details: validation.error.flatten()
            }, { status: 400 });
        }

        const { username, pin } = validation.data;

        const hashedPin = hashPin(pin);
        const user = await UserModel.findOne({ username });

        if (!user || user.pin !== hashedPin) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        const sessionToken = await signSessionToken({ userId: user.id, username: user.username }); // use user.id (uuid) for session

        // We can clear legacy fields if present
        if (user.refreshToken) {
            user.refreshToken = "";
            await user.save();
        }

        const response = NextResponse.json({ success: true, user: { id: user.id, username: user.username } });

        response.cookies.set('sessionToken', sessionToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 7 * 24 * 60 * 60 // 7 Days
        });

        // Cleanup legacy cookies
        response.cookies.delete('accessToken');
        response.cookies.delete('refreshToken');

        return response;

    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
