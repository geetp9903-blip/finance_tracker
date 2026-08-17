import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function run() {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected Successfully.");

        // Define schemas briefly to target collections
        const userSchema = new mongoose.Schema({ username: String });
        const User = mongoose.model('User', userSchema, 'users');
        
        const docSchema = new mongoose.Schema({ userId: String });
        const Transaction = mongoose.model('Transaction', docSchema, 'transactions');
        const Budget = mongoose.model('Budget', docSchema, 'budgets');
        const BudgetPeriod = mongoose.model('BudgetPeriod', docSchema, 'budgetperiods');
        const RecurringRule = mongoose.model('RecurringRule', docSchema, 'recurringrules');

        console.log("Deleting users except 'Geet9903'...");
        const usersDel = await User.deleteMany({ username: { $ne: 'Geet9903' } });
        console.log(`Deleted ${usersDel.deletedCount} users.`);

        console.log("Deleting associated data...");
        const transDel = await Transaction.deleteMany({ userId: { $ne: 'Geet9903' } });
        const budDel = await Budget.deleteMany({ userId: { $ne: 'Geet9903' } });
        const budPDel = await BudgetPeriod.deleteMany({ userId: { $ne: 'Geet9903' } });
        const recDel = await RecurringRule.deleteMany({ userId: { $ne: 'Geet9903' } });

        console.log(`Deleted ${transDel.deletedCount} transactions.`);
        console.log(`Deleted ${budDel.deletedCount} budgets.`);
        console.log(`Deleted ${budPDel.deletedCount} budget periods.`);
        console.log(`Deleted ${recDel.deletedCount} recurring rules.`);

    } catch (error) {
        console.error("Cleanup Error:", error);
    } finally {
        await mongoose.disconnect();
        console.log("Disconnected.");
    }
}

run();
