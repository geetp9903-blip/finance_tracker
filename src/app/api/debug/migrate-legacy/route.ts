import { NextResponse } from 'next/server';
import { assertAuth } from '@/lib/dal/auth';
import { TransactionModel } from '@/lib/models';
import dbConnect from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        // 1. Identify Current User
        const currentUserId = await assertAuth();
        const { searchParams } = new URL(request.url);

        // 2. Identify Source (Legacy) User
        const sourceUser = searchParams.get('source') || 'geetp9903';

        if (sourceUser === currentUserId) {
            return NextResponse.json({
                msg: "Source and Target are the same. No migration needed.",
                currentUser: currentUserId
            });
        }

        await dbConnect();

        // 3. Perform Migration
        const result = await TransactionModel.updateMany(
            { userId: sourceUser },
            { $set: { userId: currentUserId } }
        );

        return NextResponse.json({
            status: 'success',
            message: `Migrated data from '${sourceUser}' to '${currentUserId}'`,
            transactionsUpdated: result.modifiedCount,
            matched: result.matchedCount
        });

    } catch (error) {
        return NextResponse.json({
            status: 'error',
            message: error instanceof Error ? error.message : "Requires Login"
        }, { status: 401 });
    }
}
