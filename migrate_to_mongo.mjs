import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load env vars
dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('Please define the MONGODB_URI environment variable inside .env.local');
    process.exit(1);
}

// Define Schemas
const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    pin: { type: String, required: true },
});

const TransactionSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    userId: { type: String, required: true, index: true },
    amount: { type: Number, required: true },
    type: { type: String, enum: ['income', 'expense'], required: true },
    category: { type: String, required: true },
    description: { type: String, required: true },
    date: { type: String, required: true },
});

const BudgetSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    fixedExpenses: [{
        id: { type: String, required: true },
        name: { type: String, required: true },
        amount: { type: Number, required: true },
    }],
    allocations: [{
        id: { type: String, required: true },
        name: { type: String, required: true },
        percentage: { type: Number, required: true },
        color: { type: String, required: true },
    }],
    entries: [{
        id: { type: String },
        description: { type: String },
        amount: { type: Number },
        category: { type: String },
        type: { type: String },
        date: { type: String },
    }]
});

const RecurringRuleSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    userId: { type: String, required: true, index: true },
    type: { type: String, enum: ['income', 'expense'], required: true },
    category: { type: String, required: true },
    description: { type: String, required: true },
    amount: { type: Number, required: true },
    frequency: { type: String, enum: ['daily', 'weekly', 'monthly', 'yearly'], required: true },
    startDate: { type: String, required: true },
    nextDueDate: { type: String, required: true },
    active: { type: Boolean, default: true },
    lastProcessed: { type: String },
});

const User = mongoose.model('User', UserSchema);
const Transaction = mongoose.model('Transaction', TransactionSchema);
const Budget = mongoose.model('Budget', BudgetSchema);
const RecurringRule = mongoose.model('RecurringRule', RecurringRuleSchema);

async function migrate() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('Connected.');

        const dataDir = path.join(__dirname, 'data');

        // Migrate Users
        const usersFile = path.join(dataDir, 'users.json');
        if (fs.existsSync(usersFile)) {
            const users = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
            console.log(`Migrating ${users.length} users...`);
            for (const user of users) {
                await User.updateOne({ username: user.username }, user, { upsert: true });
            }
        }

        // Migrate Transactions
        const transactionsFile = path.join(dataDir, 'transactions.json');
        if (fs.existsSync(transactionsFile)) {
            const transactions = JSON.parse(fs.readFileSync(transactionsFile, 'utf8'));
            console.log(`Migrating ${transactions.length} transactions...`);
            for (const t of transactions) {
                if (!t.userId) t.userId = 'geetp9903';
                await Transaction.updateOne({ id: t.id }, t, { upsert: true });
            }
        }

        // Migrate Budget
        const budgetFile = path.join(dataDir, 'budget.json');
        if (fs.existsSync(budgetFile)) {
            const budgetData = JSON.parse(fs.readFileSync(budgetFile, 'utf8'));
            console.log(`Migrating budget...`);

            if (budgetData.fixedExpenses && Array.isArray(budgetData.fixedExpenses)) {
                await Budget.updateOne({ userId: 'geetp9903' }, { ...budgetData, userId: 'geetp9903' }, { upsert: true });
            } else {
                for (const [userId, budget] of Object.entries(budgetData)) {
                    await Budget.updateOne({ userId }, { ...budget, userId }, { upsert: true });
                }
            }
        }

        // Migrate Recurring Rules
        const recurringFile = path.join(dataDir, 'recurring.json');
        if (fs.existsSync(recurringFile)) {
            const rules = JSON.parse(fs.readFileSync(recurringFile, 'utf8'));
            console.log(`Migrating ${rules.length} recurring rules...`);
            for (const r of rules) {
                if (!r.userId) r.userId = 'geetp9903';
                await RecurringRule.updateOne({ id: r.id }, r, { upsert: true });
            }
        }

        console.log('Migration complete! 🎉');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
