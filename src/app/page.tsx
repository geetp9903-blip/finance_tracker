"use client";
import { useFinance } from "@/context/FinanceContext";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/ui/Card";
import { CurrencySelector } from "@/components/ui/CurrencySelector";
import { ArrowUpRight, ArrowDownRight, Wallet } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line, CartesianGrid, AreaChart, Area, ComposedChart, ReferenceLine } from "recharts";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Dashboard() {
  const { transactions, formatAmount, budget, currency, setCurrency } = useFinance();
  const { user, loading } = useAuth();
  const router = useRouter();
  const [budgetLimits, setBudgetLimits] = useState<Record<string, number>>({});
  const [recentSort, setRecentSort] = useState<'date' | 'amount-high' | 'amount-low'>('date');

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
    const stored = localStorage.getItem('budget_limits');
    if (stored) setBudgetLimits(JSON.parse(stored));
  }, [user, loading, router]);

  if (loading || !user) return null;

  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((acc, t) => acc + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((acc, t) => acc + t.amount, 0);

  const balance = totalIncome - totalExpense;

  // Pie Chart Data
  const expensesByCategory = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  const pieData = Object.entries(expensesByCategory).map(([name, value]) => ({ name, value }));
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  const totalBudget = Object.values(budgetLimits).reduce((a, b) => a + b, 0);
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const currentDay = now.getDate();

  // Filter for current month transactions
  const currentMonthTransactions = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  // Calculate Balance Trend Data
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfMonthBalance = transactions
    .filter(t => new Date(t.date) < startOfMonth)
    .reduce((acc, t) => acc + (t.type === 'income' ? t.amount : -t.amount), 0);

  let currentBalance = startOfMonthBalance;

  const chartData = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;

    // Calculate daily totals
    const dailyIncome = currentMonthTransactions
      .filter(t => t.type === 'income' && new Date(t.date).getDate() === day)
      .reduce((acc, t) => acc + t.amount, 0);

    const dailyExpense = currentMonthTransactions
      .filter(t => t.type === 'expense' && new Date(t.date).getDate() === day)
      .reduce((acc, t) => acc + t.amount, 0);

    // Update running balance
    if (day <= currentDay) {
      currentBalance += (dailyIncome - dailyExpense);
    }

    // Stop generating "Actual" data for future dates
    if (day > currentDay) {
      return {
        day,
        income: dailyIncome,
        expense: dailyExpense,
        budgetLimit: totalBudget,
      };
    }

    return {
      day,
      income: dailyIncome,
      expense: dailyExpense,
      balance: currentBalance, // For Balance Trend Chart
      budgetLimit: totalBudget,
    };
  });

  // Gradient Offset Calculation for Balance Chart (if needed, or just use simple gradient)
  const minBalance = Math.min(...chartData.filter(d => d.balance !== undefined).map(d => d.balance || 0), 0);
  const maxBalance = Math.max(...chartData.filter(d => d.balance !== undefined).map(d => d.balance || 0), 100);

  // Recent Transactions
  const sortedTransactions = [...transactions]
    .sort((a, b) => {
      if (recentSort === 'amount-high') return b.amount - a.amount;
      if (recentSort === 'amount-low') return a.amount - b.amount;
      return new Date(b.date).getTime() - new Date(a.date).getTime(); // default date desc
    })
    .slice(0, 5);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-white/60">Welcome back, {user.username}</p>
        </div>
        <CurrencySelector currentCurrency={currency} onSelect={setCurrency} />
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="glass-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white/60">Total Balance</p>
              <h2 className="mt-2 text-3xl font-bold text-white">{formatAmount(balance)}</h2>
            </div>
            <div className="rounded-full bg-primary/20 p-3 text-primary">
              <Wallet className="h-6 w-6" />
            </div>
          </div>
        </Card>
        <Card className="glass-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white/60">Total Income</p>
              <h2 className="mt-2 text-3xl font-bold text-emerald-400">{formatAmount(totalIncome)}</h2>
            </div>
            <div className="rounded-full bg-emerald-500/20 p-3 text-emerald-400">
              <ArrowUpRight className="h-6 w-6" />
            </div>
          </div>
        </Card>
        <Card className="glass-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white/60">Total Expenses</p>
              <h2 className="mt-2 text-3xl font-bold text-red-400">{formatAmount(totalExpense)}</h2>
            </div>
            <div className="rounded-full bg-red-500/20 p-3 text-red-400">
              <ArrowDownRight className="h-6 w-6" />
            </div>
          </div>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Income vs Expenses Chart */}
        <Card className="glass-card p-6">
          <h3 className="mb-6 text-lg font-semibold text-white">Income vs Expenses</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="#fff" tick={{ fill: '#fff', opacity: 0.5 }} />
                <YAxis stroke="#fff" tick={{ fill: '#fff', opacity: 0.5 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '8px', color: '#fff' }}
                  formatter={(value: number) => formatAmount(value)}
                  labelFormatter={(label) => `Day ${label}`}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="income"
                  stroke="#10b981"
                  fillOpacity={1}
                  fill="url(#colorIncome)"
                  name="Income"
                  strokeWidth={2}
                  dot={false}
                />
                <Area
                  type="monotone"
                  dataKey="expense"
                  stroke="#ef4444"
                  fillOpacity={1}
                  fill="url(#colorExpense)"
                  name="Expense"
                  strokeWidth={2}
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Balance Trend Chart */}
        <Card className="glass-card p-6">
          <h3 className="mb-6 text-lg font-semibold text-white">Balance Trend</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="#fff" tick={{ fill: '#fff', opacity: 0.5 }} />
                <YAxis stroke="#fff" tick={{ fill: '#fff', opacity: 0.5 }} domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '8px', color: '#fff' }}
                  formatter={(value: number, name: string) => {
                    if (name === "balance") return [formatAmount(value), "Balance"];
                    return [formatAmount(value), name];
                  }}
                  labelFormatter={(label) => `Day ${label}`}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="balance"
                  stroke="#3b82f6"
                  fill="url(#colorBalance)"
                  fillOpacity={1}
                  name="Balance"
                  connectNulls
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Recent Transactions Section */}
      <Card className="glass-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">Recent Transactions</h3>
          <div className="flex gap-2">
            <select
              value={recentSort}
              onChange={(e) => setRecentSort(e.target.value as any)}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-1 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="date" className="bg-gray-900">Most Recent</option>
              <option value="amount-high" className="bg-gray-900">Highest Amount</option>
              <option value="amount-low" className="bg-gray-900">Lowest Amount</option>
            </select>
          </div>
        </div>
        <div className="space-y-4">
          {sortedTransactions.map((t, index) => (
            <div key={t.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors">
              <div className="flex items-center gap-4">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center text-lg font-bold ${t.type === 'income' ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                  }`}>
                  {t.category.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-white">{t.description}</p>
                  <p className="text-sm text-white/50">{t.category} • {new Date(t.date).toLocaleDateString()}</p>
                </div>
              </div>
              <span className={`font-semibold ${t.type === 'income' ? "text-emerald-400" : "text-red-400"}`}>
                {t.type === 'income' ? '+' : '-'}{formatAmount(t.amount)}
              </span>
            </div>
          ))}
          {sortedTransactions.length === 0 && (
            <p className="text-center text-white/40 py-4">No recent transactions</p>
          )}
        </div>
      </Card>
    </div>
  );
}
