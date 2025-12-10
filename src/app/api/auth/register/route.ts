
import { NextResponse } from 'next/server';
import { UserModel } from '@/lib/models';
import dbConnect from '@/lib/db';
import crypto from 'crypto';

function hashPin(pin: string | number): string {
    return crypto.createHash('sha256').update(String(pin)).digest('hex');
}

export async function POST(request: Request) {
    try {
        await dbConnect();
        const { username, pin, email } = await request.json();

        if (!username || !pin) {
            return NextResponse.json({ error: 'Username and PIN are required' }, { status: 400 });
        }

        const existingUser = await UserModel.findOne({ username });
        if (existingUser) {
            return NextResponse.json({ error: 'User already exists' }, { status: 400 });
        }

        const hashedPin = hashPin(pin);

        await UserModel.create({
            id: crypto.randomUUID(),
            username,
            pin: hashedPin,
            email: email || undefined,
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Register error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
