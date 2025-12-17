import { NextRequest, NextResponse } from 'next/server';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '@/lib/auth-jwt';
import { UserModel } from '@/lib/models';
import dbConnect from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        await dbConnect();

        // 1. Check for refresh token in cookies
        const refreshToken = request.cookies.get('refreshToken')?.value;
        const fromPath = request.nextUrl.searchParams.get('from') || '/dashboard';

        if (!refreshToken) {
            console.log('Refresh Middleware: No refresh token found. Redirecting to login.');
            return NextResponse.redirect(new URL('/login', request.url));
        }

        // 2. Verify Refresh Token
        const payload = await verifyRefreshToken(refreshToken);

        if (!payload || !payload.userId) {
            console.log('Refresh Middleware: Invalid refresh token. Redirecting to login.');
            return NextResponse.redirect(new URL('/login', request.url));
        }

        // 3. Check User and Token Rotation in DB
        const user = await UserModel.findOne({ id: payload.userId });
        
        if (!user) {
            console.log('Refresh Middleware: User not found. Redirecting to login.');
            return NextResponse.redirect(new URL('/login', request.url));
        }

        if (user.refreshToken !== refreshToken) {
            console.warn(`Refresh Middleware: Token reuse detected for user ${user.username}`);
            // Clear tokens
            const response = NextResponse.redirect(new URL('/login', request.url));
            response.cookies.delete('accessToken');
            response.cookies.delete('refreshToken');
            
            // Invalidate user refresh token in DB
            user.refreshToken = '';
            await user.save();
            
            return response;
        }

        // 4. Issue New Tokens
        const newAccessToken = await signAccessToken({ userId: user.id, username: user.username });
        const newRefreshToken = await signRefreshToken({ userId: user.id, username: user.username });

        // 5. Update DB
        user.refreshToken = newRefreshToken;
        await user.save();

        // 6. Redirect back to original destination with new cookies
        const response = NextResponse.redirect(new URL(fromPath, request.url));

        // Set Access Token (15 min)
        response.cookies.set('accessToken', newAccessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 15 * 60 // 15 minutes
        });

        // Set Refresh Token (7 days)
        response.cookies.set('refreshToken', newRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 7 * 24 * 60 * 60 // 7 days
        });

        console.log(`Refresh Middleware: Successfully refreshed tokens for ${user.username}`);
        return response;

    } catch (error) {
        console.error('Refresh Middleware Error:', error);
        return NextResponse.redirect(new URL('/login', request.url));
    }
}
