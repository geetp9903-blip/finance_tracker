import { sanitizeAndAggregateFinancialData } from '@/lib/ai/sanitizer';
import { Transaction, MonthlyReminderItem, Budget } from '@/lib/types';

describe('PII Sanitizer & Data Aggregator', () => {
    it('should aggregate transactions and strip personal details', () => {
        const mockCurrentTxns: Transaction[] = [
            {
                id: 'tx-1',
                userId: 'secret_user_123',
                amount: 1500,
                type: 'expense',
                category: 'Dining Out',
                date: '2026-08-05',
                description: 'Sensitive dinner with client at fancy place'
            },
            {
                id: 'tx-2',
                userId: 'secret_user_123',
                amount: 800,
                type: 'expense',
                category: 'Dining Out',
                date: '2026-08-12',
                description: 'Uber Eats order #9928374'
            },
            {
                id: 'tx-3',
                userId: 'secret_user_123',
                amount: 10000,
                type: 'income',
                category: 'Salary',
                date: '2026-08-01',
                description: 'Confidential Paycheck from Tech Corp'
            }
        ];

        const mockReminders: MonthlyReminderItem[] = [
            {
                id: 'rem-1',
                reminderId: 'rem-1',
                title: 'Electricity Bill for Account 9928472910',
                amount: 3200,
                type: 'expense',
                category: 'Utilities',
                dueDate: '2026-08-25',
                dueDay: 25,
                status: 'pending'
            }
        ];

        const mockBudget: Budget = {
            fixedExpenses: [{ id: 'f-1', name: 'Rent', amount: 20000 }],
            allocations: [{ id: 'a-1', name: 'Dining', percentage: 20, cap: 5000, color: '#ff0000' }]
        };

        const sanitized = sanitizeAndAggregateFinancialData({
            currentTransactions: mockCurrentTxns,
            reminders: mockReminders,
            budget: mockBudget,
            currency: 'INR',
            currentBalance: 15000
        });

        // Verify aggregations
        expect(sanitized.currentPeriod.totalIncome).toBe(10000);
        expect(sanitized.currentPeriod.totalExpense).toBe(2300);
        expect(sanitized.currentPeriod.netSavings).toBe(7700);

        // Verify Dining Out category total
        const dining = sanitized.currentPeriod.categories.find(c => c.category === 'Dining Out');
        expect(dining).toBeDefined();
        expect(dining?.totalAmount).toBe(2300);
        expect(dining?.transactionCount).toBe(2);

        // Verify Upcoming reminders sanitized (account numbers masked)
        expect(sanitized.upcomingReminders.length).toBe(1);
        expect(sanitized.upcomingReminders[0].title).not.toContain('9928472910');
        expect(sanitized.upcomingReminders[0].title).toContain('****');
        expect(sanitized.upcomingReminders[0].amount).toBe(3200);

        // Verify budget config
        expect(sanitized.budgetConfiguration?.fixedExpensesTotal).toBe(20000);
        expect(sanitized.budgetConfiguration?.allocations[0].cap).toBe(5000);
    });
});
