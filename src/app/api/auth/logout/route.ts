import { NextResponse } from 'next/server';

export async function POST() {
    const response = NextResponse.json({ success: true });

    // Clear Session Token
    response.cookies.set('sessionToken', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 0 // Expire immediately
    });

    // Clear legacy tokens just in case
    response.cookies.delete('accessToken');
    response.cookies.delete('refreshToken');

    return response;
}
