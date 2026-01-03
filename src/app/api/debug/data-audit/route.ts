import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db';
import { TransactionModel, UserModel } from '@/lib/models';

export const dynamic = 'force-dynamic';

export async function GET() {
    await dbConnect();
    const db = mongoose.connection.db;

    if (!db) {
        return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    // 1. List Collections
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);

    // 2. Count Documents & Group by User (Aggregation)
    const transactionCounts = await TransactionModel.aggregate([
        { $group: { _id: "$userId", count: { $sum: 1 } } }
    ]);

    const userCount = await UserModel.countDocuments({});

    // 3. Sample Data
    const sampleTransactions = await TransactionModel.find({}).limit(5).lean();
    const sampleUsers = await UserModel.find({}).limit(5).select('username email currency').lean();

    return NextResponse.json({
        collections: collectionNames,
        data_distribution: transactionCounts, // Shows { _id: "username", count: 123 }
        user_profiles: sampleUsers
    });
}
