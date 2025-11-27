import { promises as fs } from 'node:fs';
import path from 'node:path';
import { Transaction, User, Budget, RecurringRule, BudgetPeriod } from './types';

const DATA_DIR = path.join(process.cwd(), 'data');
const TRANSACTIONS_FILE = path.join(DATA_DIR, 'transactions.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const BUDGET_FILE = path.join(DATA_DIR, 'budget.json');
const RECURRING_FILE = path.join(DATA_DIR, 'recurring.json');
const BUDGET_PERIODS_FILE = path.join(DATA_DIR, 'budget_periods.json');

async function ensureFile(filePath: string, defaultContent: any) {
    try {
        const dir = path.dirname(filePath);
        try {
            await fs.access(dir);
        } catch {
            await fs.mkdir(dir, { recursive: true });
        }
        await fs.access(filePath);
    } catch {
        await fs.writeFile(filePath, JSON.stringify(defaultContent, null, 2), 'utf8');
    }
}

export async function getTransactions(): Promise<Transaction[]> {
    await ensureFile(TRANSACTIONS_FILE, []);
    const data = await fs.readFile(TRANSACTIONS_FILE, 'utf-8');
    return JSON.parse(data);
}

export async function saveTransactions(transactions: Transaction[]) {
    await fs.writeFile(TRANSACTIONS_FILE, JSON.stringify(transactions, null, 2), 'utf8');
}

export async function getUsers(): Promise<User[]> {
    await ensureFile(USERS_FILE, []);
    const data = await fs.readFile(USERS_FILE, 'utf-8');
    return JSON.parse(data);
}

export async function saveUsers(users: User[]) {
    await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
}

export async function getBudget(): Promise<Record<string, Budget>> {
    await ensureFile(BUDGET_FILE, {});
    const data = await fs.readFile(BUDGET_FILE, 'utf-8');
    try {
        const parsed = JSON.parse(data);
        // Migration check: if it looks like a single budget (has fixedExpenses array), wrap it
        if (parsed.fixedExpenses && Array.isArray(parsed.fixedExpenses)) {
            return { "DemoUser": parsed }; // Default legacy data to DemoUser
        }
        return parsed;
    } catch {
        return {};
    }
}

export async function saveBudget(budgets: Record<string, Budget>) {
    await fs.writeFile(BUDGET_FILE, JSON.stringify(budgets, null, 2), 'utf8');
}

export async function getRecurringRules(): Promise<RecurringRule[]> {
    await ensureFile(RECURRING_FILE, []);
    const data = await fs.readFile(RECURRING_FILE, 'utf-8');
    return JSON.parse(data);
}

export async function saveRecurringRules(rules: RecurringRule[]) {
    await fs.writeFile(RECURRING_FILE, JSON.stringify(rules, null, 2), 'utf8');
}

export async function getBudgetPeriods(): Promise<BudgetPeriod[]> {
    await ensureFile(BUDGET_PERIODS_FILE, []);
    const data = await fs.readFile(BUDGET_PERIODS_FILE, 'utf-8');
    return JSON.parse(data);
}

export async function saveBudgetPeriods(periods: BudgetPeriod[]) {
    await fs.writeFile(BUDGET_PERIODS_FILE, JSON.stringify(periods, null, 2), 'utf8');
}
