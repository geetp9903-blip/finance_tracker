
import { NextResponse } from 'next/server';
import { UserModel } from '@/lib/models';
import dbConnect from '@/lib/db';
import { generateEmailOTP, sendEmailOTP, storeOTP } from '@/lib/otp';

export async function POST(request: Request) {
    try {
        await dbConnect();
        const { username, email } = await request.json();

        // Allow finding by username OR email
        let user;
        if (username) {
            user = await UserModel.findOne({ username });
        } else if (email) {
            user = await UserModel.findOne({ email });
        }

        if (!user) {
            // Security: Don't reveal user existence
            // But for this app, we might want to be helpful? 
            // Stick to generic for now to be "robust" as requested.
            // Actually, for "Forgot PIN", we want to say "Check your email".
            // If user not found, we just pretend we sent it?
            return NextResponse.json({ success: true, message: 'If user exists, OTP sent' });
        }

        const targetEmail = user.email || email; // use stored email, or provided if valid (but careful about verifying it first)

        // If user doesn't have email stored, and didn't provide one matching...
        // For security, only send to REGISTERED email.
        if (!user.email) {
            return NextResponse.json({ error: 'No email registered for this user. Contact admin.' }, { status: 400 });
        }

        const code = generateEmailOTP();

        // Store OTP in Database (Robust & Serverless compatible)
        user.otp = {
            code: code,
            expires: Date.now() + 5 * 60 * 1000 // 5 minutes
        };
        await user.save();

        await sendEmailOTP(user.email, code);

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('OTP Generate error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
