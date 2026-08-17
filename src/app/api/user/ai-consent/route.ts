import { NextResponse } from 'next/server';
import { getUser } from '@/lib/dal/auth';
import { UserModel } from '@/lib/models';
import dbConnect from '@/lib/db';
import { invalidateUserAICache } from '@/lib/ai/gemini';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const user = await getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        return NextResponse.json({
            aiConsent: user.aiConsent || {
                enabled: false,
                consentedAt: null,
                termsVersion: '1.0'
            }
        });
    } catch (error: any) {
        console.error("Failed to get AI consent status:", error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const user = await getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { enabled } = body;

        if (typeof enabled !== 'boolean') {
            return NextResponse.json({ error: 'Invalid enabled flag' }, { status: 400 });
        }

        await dbConnect();

        const updatedConsent = {
            enabled,
            consentedAt: enabled ? new Date().toISOString() : user.aiConsent?.consentedAt || null,
            termsVersion: '1.0'
        };

        if (!enabled) {
            await UserModel.findByIdAndUpdate(user._id, {
                $set: { aiConsent: updatedConsent },
                $unset: { aiInsights: 1 }
            });
        } else {
            await UserModel.findByIdAndUpdate(user._id, {
                $set: { aiConsent: updatedConsent }
            });
        }

        // Invalidate cache if disabled or changed
        invalidateUserAICache(user._id.toString());

        return NextResponse.json({
            success: true,
            aiConsent: updatedConsent
        });
    } catch (error: any) {
        console.error("Failed to update AI consent status:", error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
