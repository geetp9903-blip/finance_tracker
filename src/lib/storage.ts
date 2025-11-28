import dbConnect from './db';
import { UserModel, TransactionModel, BudgetModel, RecurringRuleModel, BudgetPeriodModel } from './models';
import { Transaction, User, Budget, RecurringRule, BudgetPeriod } from './types';

// --- Transactions ---

export async function getTransactions(userId?: string): Promise<Transaction[]> {
    await dbConnect();
    const query = userId ? { userId } : {};
    const docs = await TransactionModel.find(query).lean();
    // Map _id to id if needed, or ensure id is preserved. 
    // Our schema uses 'id' as a string field, so it should be fine.
    // We strip internal mongoose fields like _id and __v
    return docs.map(doc => {
        const { _id, __v, ...rest } = doc as any;
        return rest as Transaction;
    });
}

export async function createTransaction(transaction: Transaction) {
    await dbConnect();
    await TransactionModel.create(transaction);
}

export async function deleteTransaction(id: string, userId: string) {
    await dbConnect();
    await TransactionModel.deleteOne({ id, userId });
}

// Legacy support for seed/test scripts (overwrite all - discouraged but kept for compatibility if needed)
// Actually, for seed, we can just insert many.
export async function saveTransactions(transactions: Transaction[]) {
    await dbConnect();
    // This is dangerous in production, but for seed it's okay.
    // We'll assume this is only used by seed.
    // Upserting is safer.
    for (const t of transactions) {
        await TransactionModel.updateOne({ id: t.id }, t, { upsert: true });
    }
}

// --- Users ---

export async function getUsers(): Promise<User[]> {
    await dbConnect();
    const docs = await UserModel.find({}).lean();
    return docs.map(doc => {
        const { _id, __v, ...rest } = doc as any;
        return rest as User;
    });
}

export async function saveUsers(users: User[]) {
    await dbConnect();
    for (const u of users) {
        await UserModel.updateOne({ username: u.username }, u, { upsert: true });
    }
}

export async function createUser(user: User) {
    await dbConnect();
    await UserModel.create(user);
}

// --- Budget ---

export async function getBudget(userId?: string): Promise<Record<string, Budget>> {
    await dbConnect();
    if (userId) {
        const doc = await BudgetModel.findOne({ userId }).lean();
        if (doc) {
            const { _id, __v, userId: uid, ...budget } = doc as any;
            return { [uid]: budget as Budget };
        }
        return {};
    }
    // Fetch all (legacy support)
    const docs = await BudgetModel.find({}).lean();
    const result: Record<string, Budget> = {};
    for (const doc of docs) {
        const { _id, __v, userId: uid, ...budget } = doc as any;
        result[uid] = budget as Budget;
    }
    return result;
}

export async function saveBudget(budgets: Record<string, Budget>) {
    await dbConnect();
    // Expects a map of userId -> Budget
    for (const [userId, budget] of Object.entries(budgets)) {
        await BudgetModel.updateOne({ userId }, { ...budget, userId }, { upsert: true });
    }
}

export async function updateUserBudget(userId: string, budget: Budget) {
    await dbConnect();
    await BudgetModel.updateOne({ userId }, { ...budget, userId }, { upsert: true });
}

// --- Recurring Rules ---

export async function getRecurringRules(userId?: string): Promise<RecurringRule[]> {
    await dbConnect();
    const query = userId ? { userId } : {};
    const docs = await RecurringRuleModel.find(query).lean();
    return docs.map(doc => {
        const { _id, __v, ...rest } = doc as any;
        return rest as RecurringRule;
    });
}

export async function saveRecurringRules(rules: RecurringRule[]) {
    await dbConnect();
    for (const r of rules) {
        await RecurringRuleModel.updateOne({ id: r.id }, r, { upsert: true });
    }
}

export async function createRecurringRule(rule: RecurringRule) {
    await dbConnect();
    await RecurringRuleModel.create(rule);
}

export async function deleteRecurringRule(id: string, userId: string) {
    await dbConnect();
    await RecurringRuleModel.deleteOne({ id, userId });
}

export async function updateRecurringRule(rule: RecurringRule) {
    await dbConnect();
    await RecurringRuleModel.updateOne({ id: rule.id }, rule);
}

// --- Budget Periods ---

export async function getBudgetPeriods(userId?: string): Promise<BudgetPeriod[]> {
    await dbConnect();
    const query = userId ? { userId } : {};
    const docs = await BudgetPeriodModel.find(query).lean();
    return docs.map(doc => {
        const { _id, __v, ...rest } = doc as any;
        return rest as BudgetPeriod;
    });
}

export async function saveBudgetPeriods(periods: BudgetPeriod[]) {
    await dbConnect();
    for (const p of periods) {
        await BudgetPeriodModel.updateOne({ id: p.id }, p, { upsert: true });
    }
}

