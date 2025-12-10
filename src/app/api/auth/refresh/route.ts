
import { NextResponse } from 'next/server';
import { UserModel } from '@/lib/models';
import dbConnect from '@/lib/db';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '@/lib/auth-jwt';

// Ensure we force dynamic execution so cookies are read correctly
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        await dbConnect();

        // Get refresh token from cookie or body
        const cookieStore = request.headers.get('cookie'); // Simplify reading, or use request.cookies in Next 15/16
        // Next.js Route Handlers have a slightly different cookie API depending on version.
        // We'll trust standard Request object or helper.
        // But simpler: just check body first for explicit refresh attempts (often cleaner)
        // or check cookies.

        // NOTE: In Next.js App Router, `request.cookies` is available.
        // Let's rely on cookies for security.

        // Extract from cookie header manually if needed, or use request.cookies (NextRequest)
        // Since we typed request as `Request`, let's just parse header or use a helper if we were using NextRequest.
        // But better: use cookies() helper from next/headers if possible, but that's for Server Components/Actions mainly.
        // In Route Handlers, request.cookies is 'NextRequest' feature.

        // Let's assume request is NextRequest.
        // @ts-ignore
        const token = request.cookies?.get('refreshToken')?.value;

        if (!token) {
            return NextResponse.json({ error: 'No refresh token' }, { status: 401 });
        }

        const payload = await verifyRefreshToken(token);
        if (!payload || !payload.userId) {
            return NextResponse.json({ error: 'Invalid refresh token' }, { status: 401 });
        }

        const user = await UserModel.findOne({ id: payload.userId });
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 401 });
        }

        // Token Rotation Check
        if (user.refreshToken !== token) {
            // Token Reuse Detected! Clear everything.
            console.warn(`Reuse detected for user ${user.username}`);
            user.refreshToken = '';
            await user.save();
            const response = NextResponse.json({ error: 'Reuse detected' }, { status: 403 });
            response.cookies.delete('accessToken');
            response.cookies.delete('refreshToken');
            return response;
        }

        // Rotate
        const newAccessToken = await signAccessToken({ userId: user.id, username: user.username });
        const newRefreshToken = await signRefreshToken({ userId: user.id, username: user.username });

        user.refreshToken = newRefreshToken;
        await user.save();

        const response = NextResponse.json({ success: true });

        response.cookies.set('accessToken', newAccessToken, {
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
            path: '/',
            maxAge: 15 * 60
        });

        response.cookies.set('refreshToken', newRefreshToken, {
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
            path: '/',
            maxAge: 7 * 24 * 60 * 60
        });

        return response;

    } catch (error) {
        console.error('Refresh error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
