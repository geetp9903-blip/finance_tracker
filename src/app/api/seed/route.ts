import { NextResponse } from 'next/server';
import { saveUsers, saveTransactions, saveBudget } from '@/lib/storage';
import { Transaction, User, Budget } from '@/lib/types';

export async function GET() {
    try {
        // 1. Create Mock User
        const mockUser: User = {
            username: "DemoUser",
            pin: "1234"
        };
        await saveUsers([mockUser]);

        // 2. Create Mock Transactions
        const categories = ["Food", "Transport", "Salary", "Entertainment", "Utilities", "Shopping", "Freelance"];
        const transactions: Transaction[] = Array.from({ length: 20 }).map((_, i) => {
            const isIncome = Math.random() > 0.6;
            const category = isIncome
                ? (Math.random() > 0.5 ? "Salary" : "Freelance")
                : categories[Math.floor(Math.random() * (categories.length - 2))]; // Exclude income cats

            return {
                id: crypto.randomUUID(),
                amount: Math.floor(Math.random() * 5000) + 100,
                type: isIncome ? 'income' : 'expense',
                category: category,
                description: `${category} Payment ${i + 1}`,
                date: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString(), // Last 30 days
            };
        });
        await saveTransactions(transactions);

        // 3. Create Mock Budget
        const mockBudget: Budget = {
            fixedExpenses: [
                { id: "1", name: "Rent", amount: 15000 },
                { id: "2", name: "Internet", amount: 1000 },
                { id: "3", name: "Gym", amount: 2000 },
            ],
            allocations: [
                { id: "1", name: "Savings", percentage: 20, color: "bg-emerald-500" },
                { id: "2", name: "Investments", percentage: 30, color: "bg-blue-500" },
                { id: "3", name: "Fun", percentage: 10, color: "bg-purple-500" },
            ]
        };
        await saveBudget(mockBudget);

        return NextResponse.json({
            success: true,
            message: "Seeding complete. Login with User: DemoUser, PIN: 1234"
        });
    } catch (error) {
        return NextResponse.json({ error: 'Seeding failed' }, { status: 500 });
    }
}
