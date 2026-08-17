import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import dbConnect from '@/lib/db';
import { UserModel } from '@/lib/models';
import { signSessionToken } from '@/lib/auth-jwt';

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    const next = searchParams.get('next') ?? '/dashboard';
    
    console.log("=== OAUTH CALLBACK HIT ===");
    console.log("Code exists:", !!code);

    if (code) {
        const cookieStore = await cookies();
        console.log("Cookies available:", cookieStore.getAll().map(c => c.name));

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll()
                    },
                    setAll(cookiesToSet) {
                        try {
                            cookiesToSet.forEach(({ name, value, options }) =>
                                cookieStore.set(name, value, options)
                            )
                        } catch {
                            // Ignored
                        }
                    },
                },
            }
        );

        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        console.log("Exchange Result:", error ? `ERROR: ${error.message}` : `SUCCESS: ${data.session?.user?.email}`);
        
        if (!error && data.session?.user) {
            const email = data.session.user.email;
            
            if (!email) {
                console.log("Error: Google account missing email");
                return NextResponse.redirect(`${origin}/login?error=GoogleAccountMissingEmail`);
            }

            try {
                await dbConnect();
                const user = await UserModel.findOne({ email });

                if (user) {
                    console.log(`Found existing user for email ${email}, id: ${user.id}`);
                    // Existing User -> Issue custom Session Token
                    const sessionToken = await signSessionToken({ userId: user.id, username: user.username });
                    console.log("Session token created successfully, setting cookie and redirecting to", next);
                    
                    cookieStore.set('sessionToken', sessionToken, {
                        httpOnly: true,
                        secure: process.env.NODE_ENV === 'production',
                        sameSite: 'lax',
                        path: '/',
                        maxAge: 7 * 24 * 60 * 60 // 7 Days
                    });
                    return NextResponse.redirect(new URL(next, origin));
                } else {
                    console.log(`No user found for email ${email}. Redirecting to setup-username.`);
                    // New User -> Redirect to Username/PIN setup
                    cookieStore.set('temp_signup_email', email, {
                        httpOnly: true,
                        secure: process.env.NODE_ENV === 'production',
                        sameSite: 'lax',
                        path: '/',
                        maxAge: 15 * 60 // 15 mins
                    });
                    return NextResponse.redirect(new URL('/setup-username', origin));
                }
            } catch (err) {
                console.error("Auth Callback DB Error:", err);
                return NextResponse.redirect(`${origin}/login?error=InternalServerError`);
            }
        } else {
            console.error("Supabase OAuth Exchange API Error:", error);
        }
    } else {
        console.log("No code param found in OAuth callback");
    }

    console.log("Callback failed, redirecting to login with AuthFailed error");
    return NextResponse.redirect(new URL('/login?error=AuthFailed', origin));
}
