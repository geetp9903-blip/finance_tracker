import { NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/auth-jwt';
import { UserModel } from '@/lib/models';
import dbConnect from '@/lib/db';

import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        await dbConnect();

        // 1. Get Token from Cookie using next/headers
        const cookieStore = await cookies();
        const token = cookieStore.get('sessionToken')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        // 2. Verify Token
        const payload = await verifySessionToken(token);
        if (!payload || !payload.userId) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        // 3. Get User (Project specific fields)
        const user = await UserModel.findOne({ id: payload.userId }).select('-pin -totpSecret -otp -refreshToken');

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 401 });
        }

        return NextResponse.json({ user });

    } catch (error) {
        console.error('Profile check error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
