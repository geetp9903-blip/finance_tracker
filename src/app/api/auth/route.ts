import { NextResponse } from 'next/server';
import { getUsers, saveUsers } from '@/lib/storage';
import crypto from 'crypto';

function hashPin(pin: string): string {
    return crypto.createHash('sha256').update(pin).digest('hex');
}

export async function POST(request: Request) {
    try {
        const { action, username, pin } = await request.json();
        const users = await getUsers();

        if (action === 'register') {
            if (users.find(u => u.username === username)) {
                return NextResponse.json({ error: 'User already exists' }, { status: 400 });
            }

            const hashedPin = hashPin(pin);
            users.push({ username, pin: hashedPin });
            await saveUsers(users);
            return NextResponse.json({ success: true });
        }

        if (action === 'login') {
            const hashedPin = hashPin(pin);
            const user = users.find(u => u.username === username && u.pin === hashedPin);
            if (user) {
                return NextResponse.json({ success: true, user });
            }
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
