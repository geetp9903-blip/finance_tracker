'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { LoginSchema, RegisterSchema } from '@/lib/schemas';
import { UserModel } from '@/lib/models';
import dbConnect from '@/lib/db';
import { signSessionToken } from '@/lib/auth-jwt';
import crypto from 'crypto';
import { cookies } from 'next/headers';

export type AuthState = {
    message?: string;
    errors?: Record<string, string[]>;
    success?: boolean;
};

function hashPin(pin: string | number): string {
    return crypto.createHash('sha256').update(String(pin)).digest('hex');
}

export async function loginAction(
    prevState: AuthState,
    formData: FormData
): Promise<AuthState> {
    try {
        await dbConnect();

        const rawData = {
            username: formData.get('username'),
            pin: formData.get('pin'),
        };

        const validated = LoginSchema.safeParse(rawData);

        if (!validated.success) {
            return {
                message: 'Invalid input.',
                errors: validated.error.flatten().fieldErrors
            };
        }

        const { username, pin } = validated.data;
        const hashedPin = hashPin(pin);

        const user = await UserModel.findOne({ username });

        if (!user || user.pin !== hashedPin) {
            return { message: 'Invalid credentials.' };
        }

        const sessionToken = await signSessionToken({ userId: user.id, username: user.username });

        // Use 'await cookies()' in Next 15+ or standard cookies() in 14
        const cookieStore = await cookies();
        cookieStore.set('sessionToken', sessionToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 7 * 24 * 60 * 60
        });

        // We can't redirect inside a try/catch easily in some versions without it being caught as an error
        // But in Server Actions, redirect() throws a NEXT_REDIRECT error which is handled.
    } catch (error) {
        // re-throw redirect error
        if ((error as any).message === 'NEXT_REDIRECT') throw error;

        console.error('Login error:', error);
        return { message: 'Database Error: Failed to login.' };
    }

    redirect('/dashboard');
}

export async function registerAction(
    prevState: AuthState,
    formData: FormData
): Promise<AuthState> {
    try {
        await dbConnect();

        const rawData = {
            username: formData.get('username'),
            pin: formData.get('pin'),
            email: formData.get('email') || undefined,
        };

        const validated = RegisterSchema.safeParse(rawData);

        if (!validated.success) {
            return {
                message: 'Invalid input.',
                errors: validated.error.flatten().fieldErrors
            };
        }

        const { username, pin, email } = validated.data;

        const existingUser = await UserModel.findOne({ username });
        if (existingUser) {
            return { message: 'Username already taken.' };
        }

        if (email) {
            const existingEmail = await UserModel.findOne({ email });
            if (existingEmail) {
                return { message: 'Email already registered.' };
            }
        }

        const hashedPin = hashPin(pin);
        const userId = crypto.randomUUID();

        const newUser = await UserModel.create({
            id: userId,
            username,
            pin: hashedPin,
            email,
        });

        const sessionToken = await signSessionToken({ userId: newUser.id, username: newUser.username });

        const cookieStore = await cookies();
        cookieStore.set('sessionToken', sessionToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 7 * 24 * 60 * 60
        });

    } catch (error) {
        if ((error as any).message === 'NEXT_REDIRECT') throw error;
        console.error('Register error:', error);
        return { message: 'Registration failed.' };
    }

    redirect('/dashboard');
}

export async function logout() {
    const cookieStore = await cookies();
    cookieStore.delete('sessionToken');
    redirect('/login');
}

import { sendOtpEmail } from '@/lib/email';

export async function requestPinReset(username: string) {
    try {
        await dbConnect();
        const user = await UserModel.findOne({ username });
        if (!user) return { success: false, message: 'User not found' };

        if (!user.email) {
            return { success: false, message: 'No email linked to this account.' };
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        user.otp = {
            code: otp,
            expires: Date.now() + 10 * 60 * 1000 // 10 mins
        };
        await user.save();

        // Send Email
        const emailSent = await sendOtpEmail(user.email, otp);

        if (!emailSent) {
            return { success: true, message: 'OTP Generated. Check Console (Email failed).' };
        }

        return { success: true, message: 'otp sent' }; // Lowercase to match user prompt style if needed, but keeping it standard
    } catch (e) {
        return { success: false, message: 'Failed to generate OTP' };
    }
}

export async function resetPin(username: string, otp: string, newPin: string) {
    try {
        await dbConnect();
        const user = await UserModel.findOne({ username });

        if (!user || !user.otp || user.otp.code !== otp) {
            return { success: false, message: 'Invalid OTP' };
        }

        if (Date.now() > user.otp.expires!) {
            return { success: false, message: 'OTP Expired' };
        }

        user.pin = hashPin(newPin);
        user.otp = undefined; // Clear OTP
        await user.save();

        return { success: true, message: 'PIN Reset Successful' };
    } catch (e) {
        return { success: false, message: 'Failed to reset PIN' };
    }
}
