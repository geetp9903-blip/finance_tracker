import { NextResponse } from 'next/server';
import { UserModel } from '@/lib/models';
import dbConnect from '@/lib/db';
import crypto from 'crypto';
import { RegisterSchema } from '@/lib/schemas';
import { signSessionToken } from '@/lib/auth-jwt';

function hashPin(pin: string | number): string {
    return crypto.createHash('sha256').update(String(pin)).digest('hex');
}

export async function POST(request: Request) {
    try {
        await dbConnect();
        const body = await request.json();

        // 1. Zod Validation
        const validation = RegisterSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({
                error: 'Invalid input',
                details: validation.error.flatten()
            }, { status: 400 });
        }

        const { username, pin, email } = validation.data;

        // 2. Business Logic: Check duplicate
        const existingUser = await UserModel.findOne({ username });
        if (existingUser) {
            return NextResponse.json({ error: 'User already exists' }, { status: 400 });
        }

        const hashedPin = hashPin(pin);
        const userId = crypto.randomUUID();

        const newUser = await UserModel.create({
            id: userId,
            username,
            pin: hashedPin,
            email: email || undefined,
        });

        // 3. Auto-Login (Set Cookie)
        const sessionToken = await signSessionToken({ userId: newUser.id, username: newUser.username });

        const response = NextResponse.json({ success: true, user: { id: newUser.id, username: newUser.username } });

        response.cookies.set('sessionToken', sessionToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 7 * 24 * 60 * 60 // 7 Days
        });

        return response;

    } catch (error) {
        console.error('Register error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
