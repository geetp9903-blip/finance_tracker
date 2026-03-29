import { NextResponse } from 'next/server';
import { UserModel } from '@/lib/models';
import dbConnect from '@/lib/db';
import crypto from 'crypto';
import { signSessionToken } from '@/lib/auth-jwt';
import { cookies } from 'next/headers';

function hashPin(pin: string | number): string {
    return crypto.createHash('sha256').update(String(pin)).digest('hex');
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { username, pin } = body;

        const cookieStore = await cookies();
        const email = cookieStore.get('temp_signup_email')?.value;

        if (!email) {
            return NextResponse.json({ error: 'Session expired. Please try Google login again.' }, { status: 400 });
        }

        if (!username || !pin || username.length < 3 || pin.length < 4) {
            return NextResponse.json({ error: 'Invalid username or PIN format.' }, { status: 400 });
        }

        await dbConnect();

        // Check if username is taken
        const existingUsername = await UserModel.findOne({ username });
        if (existingUsername) {
            return NextResponse.json({ error: 'Username is already taken' }, { status: 400 });
        }

        const hashedPin = hashPin(pin);

        // Create the user
        const newUser = await UserModel.create({
            username,
            pin: hashedPin,
            email,
        });

        // Issue token
        const sessionToken = await signSessionToken({ userId: newUser.id, username: newUser.username });
        
        const response = NextResponse.json({ success: true, user: { id: newUser.id, username: newUser.username } });

        // Set session cookie
        response.cookies.set('sessionToken', sessionToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 7 * 24 * 60 * 60 // 7 Days
        });

        // Delete temporary signup email cookie
        response.cookies.delete('temp_signup_email');

        return response;

    } catch (error) {
        console.error('Setup username error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
