import mongoose, { Schema, model, models } from 'mongoose';
import { User, Transaction, Budget, RecurringRule, BudgetPeriod } from './types';

// User Schema
const UserSchema = new Schema<User>({
    username: { type: String, required: true, unique: true },
    pin: { type: String, required: true },
});

// Transaction Schema
const TransactionSchema = new Schema<Transaction>({
    id: { type: String, required: true, unique: true },
    userId: { type: String, required: true, index: true },
    amount: { type: Number, required: true },
    type: { type: String, enum: ['income', 'expense'], required: true },
    category: { type: String, required: true },
    description: { type: String, required: true },
    date: { type: String, required: true },
});

// Budget Schema
// Note: Budget in types.ts is { fixedExpenses: [], allocations: [], entries?: [] }
// We store it per user.
const BudgetEntrySchema = new Schema({
    id: { type: String, required: true },
    name: { type: String, required: true },
    amount: { type: Number, required: true },
    type: { type: String, enum: ['income', 'expense'], required: true },
    date: { type: String, required: true },
});

const BudgetSchema = new Schema({
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
    entries: [BudgetEntrySchema]
});

// Recurring Rule Schema
const RecurringRuleSchema = new Schema<RecurringRule>({
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

// Budget Period Schema
const BudgetPeriodSchema = new Schema<BudgetPeriod>({
    id: { type: String, required: true, unique: true },
    userId: { type: String, required: true, index: true },
    startDate: { type: String, required: true },
    endDate: { type: String, required: true },
    budget: { type: Object, required: true }, // Store snapshot of budget
    transactions: [{ type: String }], // Array of transaction IDs
});

export const UserModel = models.User || model<User>('User', UserSchema);
export const TransactionModel = models.Transaction || model<Transaction>('Transaction', TransactionSchema);
export const BudgetModel = models.Budget || model('Budget', BudgetSchema);
export const RecurringRuleModel = models.RecurringRule || model<RecurringRule>('RecurringRule', RecurringRuleSchema);
export const BudgetPeriodModel = models.BudgetPeriod || model<BudgetPeriod>('BudgetPeriod', BudgetPeriodSchema);
