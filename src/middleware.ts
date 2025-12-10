
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAccessToken } from './lib/auth-jwt';
import { checkRateLimit } from './lib/rate-limit';

// Paths to protect
const PROTECTED_PATHS = ['/dashboard', '/analytics', '/budget', '/calendar', '/settings'];

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    // Fix: 'ip' property access or fallback to headers
    const ip = (request as any).ip || request.headers.get('x-forwarded-for') || '127.0.0.1';

    // 1. Rate Limiting logic for API routes
    if (pathname.startsWith('/api/')) {
        let type: 'auth' | 'data' = 'data';
        if (pathname.startsWith('/api/auth')) {
            type = 'auth';
        }

        const result = checkRateLimit(ip, type);

        if (!result.success) {
            return NextResponse.json(
                { error: 'Too Many Requests', retryAfter: result.reset },
                { status: 429, headers: { 'Retry-After': String((result.reset! - Date.now()) / 1000) } }
            );
        }
    }

    // 2. Route Protection Logic
    // Check if path matches any protected path prefix
    const isProtected = PROTECTED_PATHS.some(path => pathname.startsWith(path));

    if (!isProtected) {
        return NextResponse.next();
    }

    const accessToken = request.cookies.get('accessToken')?.value;

    if (!accessToken) {
        console.log('Middleware: No access token found. Redirecting to login.');
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        return NextResponse.redirect(url);
    }

    try {
        const payload = await verifyAccessToken(accessToken);
        if (!payload) {
            console.log('Middleware: Token verification failed (null payload). Redirecting.');
            if (pathname.startsWith('/api/')) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }
            const url = request.nextUrl.clone();
            url.pathname = '/login';
            return NextResponse.redirect(url);
        }

        const response = NextResponse.next();
        // Pass user info to backend via headers if needed
        response.headers.set('x-user-id', payload.userId as string);
        return response;

    } catch (e) {
        console.error('Middleware: Token verification error:', e);
        if (pathname.startsWith('/api/')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        return NextResponse.redirect(url);
    }
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
