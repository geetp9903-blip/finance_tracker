
import { getTransactions } from "@/lib/dal/finance";
import { TransactionManager } from "@/components/finance/TransactionManager";
import { assertAuth } from "@/lib/dal/auth";
import { UserModel } from "@/lib/models";
import dbConnect from "@/lib/db";

export const revalidate = 60;

export default async function TransactionsPage() {
    const { data: transactions } = await getTransactions(20); // Fetch more for the list

    // Transform ObjectIds or Dates if needed, although DAL already maps them to strings
    // Ensure types match what TransactionManager expects
    const sanitizedTransactions = transactions.map(t => ({
        id: t.id,
        description: t.description,
        amount: t.amount,
        type: t.type as 'income' | 'expense',
        category: t.category,
        date: t.date
    }));

    // Fetch User Currency
    const userId = await assertAuth();
    await dbConnect();
    const user = await UserModel.findOne({ username: userId }).lean();
    const currency = user?.currency || 'USD';

    return (
        <TransactionManager
            initialTransactions={sanitizedTransactions}
            currency={currency}
        />
    );
}
