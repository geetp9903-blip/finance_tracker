"use client";
import { useFinance } from "@/context/FinanceContext";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/ui/Card";
import { CurrencySelector } from "@/components/ui/CurrencySelector";
import { ArrowUpRight, ArrowDownRight, Wallet } from "lucide-react";
import { MonthYearPicker } from "@/components/ui/MonthYearPicker";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line, CartesianGrid, AreaChart, Area, ComposedChart, ReferenceLine } from "recharts";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Dashboard() {
  const { transactions, formatAmount, budget, currency, setCurrency } = useFinance();
  const { user, loading } = useAuth();
  const router = useRouter();
  const [budgetLimits, setBudgetLimits] = useState<Record<string, number>>({});
  const [recentSort, setRecentSort] = useState<'date' | 'amount-high' | 'amount-low'>('date');

  // Independent States
  const [summaryDate, setSummaryDate] = useState(new Date());
  const [incomeDate, setIncomeDate] = useState(new Date());
  const [balanceDate, setBalanceDate] = useState(new Date());

  const [incomeViewMode, setIncomeViewMode] = useState<'month' | 'year'>('month');
  const [balanceViewMode, setBalanceViewMode] = useState<'month' | 'year'>('month');

  const [summaryViewMode, setSummaryViewMode] = useState<'month' | 'year'>('month');

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
    const stored = localStorage.getItem('budget_limits');
    if (stored) setBudgetLimits(JSON.parse(stored));

    // Process recurring expenses
    if (user) {
      fetch('/api/recurring', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id
        },
        body: JSON.stringify({ action: 'process' })
      }).catch(err => console.error('Failed to process recurring expenses:', err));
    }
  }, [user, loading, router]);

  if (loading || !user) return null;

  // --- Summary Cards Data ---
  // Period for Income/Expense Calculation
  const summaryTransactions = transactions.filter(t => {
    const d = new Date(t.date);
    if (summaryViewMode === 'month') {
      return d.getMonth() === summaryDate.getMonth() && d.getFullYear() === summaryDate.getFullYear();
    } else {
      return d.getFullYear() === summaryDate.getFullYear();
    }
  });

  const totalIncome = summaryTransactions
    .filter((t) => t.type === "income")
    .reduce((acc, t) => acc + t.amount, 0);

  const totalExpense = summaryTransactions
    .filter((t) => t.type === "expense")
    .reduce((acc, t) => acc + t.amount, 0);

  // Balance Calculation (Cumulative up to the end of the selected period)
  const periodEnd = summaryViewMode === 'month'
    ? new Date(summaryDate.getFullYear(), summaryDate.getMonth() + 1, 0) // End of selected month
    : new Date(summaryDate.getFullYear(), 11, 31); // End of selected year

  const balance = transactions
    .filter(t => new Date(t.date) <= periodEnd)
    .reduce((acc, t) => acc + (t.type === 'income' ? t.amount : -t.amount), 0);


  // --- Helper for Chart Data Generation ---
  const generateChartData = (date: Date, viewMode: 'month' | 'year') => {
    const now = new Date();
    const isCurrentMonth = date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    const currentDay = now.getDate();

    if (viewMode === 'month') {
      const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);

      // Opening Balance for the month
      const startOfMonthBalance = transactions
        .filter(t => new Date(t.date) < startOfMonth)
        .reduce((acc, t) => acc + (t.type === 'income' ? t.amount : -t.amount), 0);

      let cumulativeIncome = 0;
      let cumulativeExpense = 0;
      let runningBalance = startOfMonthBalance;

      return Array.from({ length: daysInMonth }, (_, i) => {
        const day = i + 1;
        const dayTransactions = transactions.filter(t => {
          const d = new Date(t.date);
          return d.getDate() === day && d.getMonth() === date.getMonth() && d.getFullYear() === date.getFullYear();
        });

        const dailyIncome = dayTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
        const dailyExpense = dayTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);

        if (isCurrentMonth && day > currentDay) {
          return { name: day.toString(), income: null, expense: null, balance: null };
        }

        cumulativeIncome += dailyIncome;
        cumulativeExpense += dailyExpense;
        runningBalance += (dailyIncome - dailyExpense);

        return {
          name: day.toString(),
          income: startOfMonthBalance + cumulativeIncome,
          expense: cumulativeExpense,
          balance: runningBalance
        };
      });
    } else {
      // Year View
      const startOfYear = new Date(date.getFullYear(), 0, 1);
      const startOfYearBalance = transactions
        .filter(t => new Date(t.date) < startOfYear)
        .reduce((acc, t) => acc + (t.type === 'income' ? t.amount : -t.amount), 0);

      let runningIncomeYear = 0;
      let runningExpenseYear = 0;
      let runningBalanceYear = startOfYearBalance;

      return Array.from({ length: 12 }, (_, i) => {
        const monthStart = new Date(date.getFullYear(), i, 1);
        const isFutureMonth = date.getFullYear() === now.getFullYear() && i > now.getMonth();

        const monthTransactions = transactions.filter(t => {
          const d = new Date(t.date);
          return d.getMonth() === i && d.getFullYear() === date.getFullYear();
        });

        const monthlyIncome = monthTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
        const monthlyExpense = monthTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);

        if (isFutureMonth) {
          return { name: monthStart.toLocaleString('default', { month: 'short' }), income: null, expense: null, balance: null };
        }

        runningIncomeYear += monthlyIncome;
        runningExpenseYear += monthlyExpense;
        runningBalanceYear += (monthlyIncome - monthlyExpense);

        return {
          name: monthStart.toLocaleString('default', { month: 'short' }),
          income: startOfYearBalance + runningIncomeYear,
          expense: runningExpenseYear,
          balance: runningBalanceYear
        };
      });
    }
  };

  const incomeChartData = generateChartData(incomeDate, incomeViewMode);
  const balanceChartData = generateChartData(balanceDate, balanceViewMode);

  // Recent Transactions
  const sortedTransactions = [...transactions]
    .sort((a, b) => {
      if (recentSort === 'amount-high') return b.amount - a.amount;
      if (recentSort === 'amount-low') return a.amount - b.amount;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
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

      {/* Summary Cards Section */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-white">Summary</h2>
            <div className="flex gap-2 bg-white/5 rounded-lg p-1">
              <button
                onClick={() => setSummaryViewMode('month')}
                className={`px-3 py-1 rounded-md text-sm transition-all cursor-pointer ${summaryViewMode === 'month' ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg' : 'text-white/60 hover:text-white'}`}
              >
                Month
              </button>
              <button
                onClick={() => setSummaryViewMode('year')}
                className={`px-3 py-1 rounded-md text-sm transition-all cursor-pointer ${summaryViewMode === 'year' ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg' : 'text-white/60 hover:text-white'}`}
              >
                Year
              </button>
            </div>
          </div>
          <MonthYearPicker selectedDate={summaryDate} onChange={setSummaryDate} />
        </div>
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
      </div>

      {/* Charts Section */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Income vs Expenses Chart */}
        <Card className="glass-card p-6">
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Income vs Expenses</h3>
              <div className="flex gap-2 bg-white/5 rounded-lg p-1">
                <button
                  onClick={() => setIncomeViewMode('month')}
                  className={`px-3 py-1 rounded-md text-sm transition-all cursor-pointer ${incomeViewMode === 'month' ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg' : 'text-white/60 hover:text-white'}`}
                >
                  Month
                </button>
                <button
                  onClick={() => setIncomeViewMode('year')}
                  className={`px-3 py-1 rounded-md text-sm transition-all cursor-pointer ${incomeViewMode === 'year' ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg' : 'text-white/60 hover:text-white'}`}
                >
                  Year
                </button>
              </div>
            </div>
            <div className="self-end">
              <MonthYearPicker selectedDate={incomeDate} onChange={setIncomeDate} />
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={incomeChartData}>
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
                <XAxis dataKey="name" stroke="#fff" tick={{ fill: '#fff', opacity: 0.5 }} />
                <YAxis stroke="#fff" tick={{ fill: '#fff', opacity: 0.5 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '8px', color: '#fff' }}
                  formatter={(value: number) => formatAmount(value)}
                  labelFormatter={(label) => incomeViewMode === 'month' ? `Day ${label}` : label}
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
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Balance Trend</h3>
              <div className="flex gap-2 bg-white/5 rounded-lg p-1">
                <button
                  onClick={() => setBalanceViewMode('month')}
                  className={`px-3 py-1 rounded-md text-sm transition-all cursor-pointer ${balanceViewMode === 'month' ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg' : 'text-white/60 hover:text-white'}`}
                >
                  Month
                </button>
                <button
                  onClick={() => setBalanceViewMode('year')}
                  className={`px-3 py-1 rounded-md text-sm transition-all cursor-pointer ${balanceViewMode === 'year' ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg' : 'text-white/60 hover:text-white'}`}
                >
                  Year
                </button>
              </div>
            </div>
            <div className="self-end">
              <MonthYearPicker selectedDate={balanceDate} onChange={setBalanceDate} />
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={balanceChartData}>
                <defs>
                  <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#fff" tick={{ fill: '#fff', opacity: 0.5 }} />
                <YAxis stroke="#fff" tick={{ fill: '#fff', opacity: 0.5 }} domain={[0, 'auto']} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '8px', color: '#fff' }}
                  formatter={(value: number, name: string) => {
                    if (name === "balance") return [formatAmount(value), "Balance"];
                    return [formatAmount(value), name];
                  }}
                  labelFormatter={(label) => balanceViewMode === 'month' ? `Day ${label}` : label}
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
