import { NextResponse } from 'next/server';
import { getUsers, saveUsers } from '@/lib/storage';

export async function POST(request: Request) {
    try {
        const { action, username, pin } = await request.json();
        const users = await getUsers();

        if (action === 'register') {
            if (users.find(u => u.username === username)) {
                return NextResponse.json({ error: 'User already exists' }, { status: 400 });
            }
            // In a real app, hash the PIN. Here we store plain text as per "simple" requirement.
            users.push({ username, pin });
            await saveUsers(users);
            return NextResponse.json({ success: true });
        }

        if (action === 'login') {
            const user = users.find(u => u.username === username && u.pin === pin);
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
