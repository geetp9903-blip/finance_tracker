import { Schema, model, models } from 'mongoose';
import { User, Transaction, RecurringRule, BudgetPeriod } from './types';

// User Schema
const UserSchema = new Schema<User>({
    username: { type: String, required: true, unique: true },
    pin: { type: String, required: true },
    email: { type: String, unique: true, sparse: true },
    totpSecret: { type: String },
    refreshToken: { type: String },
    otp: {
        code: { type: String },
        expires: { type: Number }
    },
    currency: { type: String, default: 'INR' },
    usernameUpdates: {
        count: { type: Number, default: 0 },
        lastReset: { type: Number, default: Date.now }
    },
    inactivityNotices: {
        sent38: { type: Boolean, default: false },
        sent42: { type: Boolean, default: false },
        sent44: { type: Boolean, default: false }
    },
    dashboardLayout: { type: Object },
    aiConsent: {
        enabled: { type: Boolean, default: false },
        consentedAt: { type: String },
        termsVersion: { type: String, default: '1.0' }
    },
    aiInsights: {
        data: { type: Object },
        lastGeneratedAt: { type: String }
    }
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
    recurringRuleId: { type: String },
    reminderId: { type: String },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: String },
});

// Transaction Reminder Template Schema
const TransactionReminderSchema = new Schema({
    id: { type: String, required: true, unique: true },
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    amount: { type: Number, required: true },
    type: { type: String, enum: ['income', 'expense'], required: true },
    category: { type: String, required: true },
    frequency: { type: String, enum: ['daily', 'weekly', 'monthly', 'yearly'], default: 'monthly' },
    dueDay: { type: Number, required: true, default: 1 }, // 1-31
    active: { type: Boolean, default: true },
    startDate: { type: String },
});

// Reminder Status Per Period Schema
const ReminderStatusSchema = new Schema({
    id: { type: String, required: true, unique: true },
    reminderId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    periodKey: { type: String, required: true, index: true }, // "YYYY-MM"
    status: { type: String, enum: ['pending', 'paid', 'skipped', 'expired'], default: 'pending' },
    paidTransactionId: { type: String },
    actualAmount: { type: Number },
    paidDate: { type: String },
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
        cap: { type: Number }, // Optional hard limit
        color: { type: String, required: true },
    }],
    entries: [BudgetEntrySchema]
});

// Recurring Rule Schema (Legacy)
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
export const TransactionReminderModel = models.TransactionReminder || model('TransactionReminder', TransactionReminderSchema);
export const ReminderStatusModel = models.ReminderStatus || model('ReminderStatus', ReminderStatusSchema);

