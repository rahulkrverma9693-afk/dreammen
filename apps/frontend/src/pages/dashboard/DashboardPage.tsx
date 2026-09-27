import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp, ShoppingBag, Users, AlertTriangle,
  CreditCard, Smartphone, Banknote, Wallet,
  ArrowUpRight, ArrowDownRight, Star,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import api from '../../utils/api';
import { formatCurrency } from '../../utils/cn';

function StatCard({
  title, value, icon: Icon, subtitle, trend, color = 'primary',
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  subtitle?: string;
  trend?: { value: number; positive: boolean };
  color?: 'primary' | 'success' | 'warning' | 'info';
}) {
  const colorMap = {
    primary: 'text-primary bg-rose-panel',
    success: 'text-success bg-green-50',
    warning: 'text-warning bg-amber-50',
    info: 'text-blue-600 bg-blue-50',
  };

  return (
    <div className="stat-card">
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 rounded-card flex items-center justify-center ${colorMap[color]}`}>
          <Icon size={20} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-medium ${trend.positive ? 'text-success' : 'text-error'}`}>
            {trend.positive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {trend.value}%
          </div>
        )}
      </div>
      <div className="mt-3">
        <p className="text-text-secondary text-xs font-medium uppercase tracking-wide">{title}</p>
        <p className="font-heading font-bold text-2xl text-text-primary mt-0.5">{value}</p>
        {subtitle && <p className="text-text-secondary text-xs mt-1">{subtitle}</p>}
      </div>
    </div>
  );
}

const CHART_COLORS = ['#C2185B', '#F48FB1', '#880E4F', '#FCE4EC', '#e91e63'];

export default function DashboardPage() {
  const { data: summary, isLoading } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: async () => {
      const res = await api.get('/dashboard/summary');
      return res.data.data;
    },
    refetchInterval: 30000, // refresh every 30s
  });

  // Mock weekly revenue data for chart (replace with real API)
  const weeklyData = [
    { day: 'Mon', revenue: 12400, expenses: 3200 },
    { day: 'Tue', revenue: 18900, expenses: 4100 },
    { day: 'Wed', revenue: 15600, expenses: 2800 },
    { day: 'Thu', revenue: 22100, expenses: 5200 },
    { day: 'Fri', revenue: 28400, expenses: 6100 },
    { day: 'Sat', revenue: 35200, expenses: 7800 },
    { day: 'Sun', revenue: 19800, expenses: 4300 },
  ];

  const paymentPieData = summary ? [
    { name: 'Cash',   value: summary.paymentBreakdown?.CASH || 0 },
    { name: 'UPI',    value: summary.paymentBreakdown?.UPI || 0 },
    { name: 'Card',   value: summary.paymentBreakdown?.CARD || 0 },
    { name: 'Wallet', value: summary.paymentBreakdown?.WALLET || 0 },
  ].filter(d => d.value > 0) : [];

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="skeleton h-32 rounded-card" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-bold text-2xl text-text-primary">Dashboard</h1>
          <p className="text-text-secondary text-sm mt-0.5">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2 bg-rose-panel rounded-button px-4 py-2">
          <Star size={16} className="text-primary fill-primary" />
          <span className="text-sm font-medium text-primary">Today's Overview</span>
        </div>
      </div>

      {/* Stat Cards Row 1 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Income"
          value={formatCurrency(summary?.income || 0)}
          icon={TrendingUp}
          subtitle={`${summary?.billCount || 0} bills today`}
          trend={{ value: 12, positive: true }}
          color="primary"
        />
        <StatCard
          title="Total Expenses"
          value={formatCurrency(summary?.expenses || 0)}
          icon={ShoppingBag}
          subtitle="Logged today"
          trend={{ value: 3, positive: false }}
          color="warning"
        />
        <StatCard
          title="Net Profit"
          value={formatCurrency(summary?.netProfit || 0)}
          icon={TrendingUp}
          subtitle="Income - Expenses"
          color="success"
        />
        <StatCard
          title="Balance Due"
          value={formatCurrency(summary?.balanceDue || 0)}
          icon={AlertTriangle}
          subtitle="Outstanding payments"
          color="warning"
        />
      </div>

      {/* Income by Type */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { key: 'SERVICE',     label: 'Services',   icon: Star },
          { key: 'PRODUCT',     label: 'Products',   icon: ShoppingBag },
          { key: 'MEMBERSHIP',  label: 'Memberships',icon: Users },
          { key: 'SPA_PACK',    label: 'Spa Packs',  icon: Star },
        ].map(({ key, label, icon }) => (
          <StatCard
            key={key}
            title={label}
            value={formatCurrency(summary?.incomeByType?.[key] || 0)}
            icon={icon}
            color="info"
          />
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 card-glass p-6">
          <h3 className="section-header mb-4">Weekly Revenue vs Expenses</h3>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={weeklyData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#C2185B" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#C2185B" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expensesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F48FB1" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#F48FB1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#FCE4EC" />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#6D6D6D' }} />
              <YAxis tick={{ fontSize: 12, fill: '#6D6D6D' }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(value: any) => formatCurrency(Number(value || 0))} />
              <Area type="monotone" dataKey="revenue" stroke="#C2185B" strokeWidth={2} fill="url(#revenueGrad)" name="Revenue" />
              <Area type="monotone" dataKey="expenses" stroke="#F48FB1" strokeWidth={2} fill="url(#expensesGrad)" name="Expenses" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Payment Breakdown Pie */}
        <div className="card-glass p-6">
          <h3 className="section-header mb-4">Payments Today</h3>
          {paymentPieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={paymentPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                  paddingAngle={3} dataKey="value">
                  {paymentPieData.map((_, idx) => (
                    <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => formatCurrency(Number(value || 0))} />
                <Legend iconType="circle" iconSize={8} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-text-secondary text-sm">
              No payments yet today
            </div>
          )}
          {/* Payment Method Breakdown */}
          <div className="mt-4 space-y-2">
            {[
              { label: 'Cash',   icon: Banknote,    key: 'CASH' },
              { label: 'UPI',    icon: Smartphone,  key: 'UPI' },
              { label: 'Card',   icon: CreditCard,  key: 'CARD' },
              { label: 'Wallet', icon: Wallet,       key: 'WALLET' },
            ].map(({ label, icon: Icon, key }) => (
              <div key={key} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-text-secondary">
                  <Icon size={14} />
                  {label}
                </div>
                <span className="font-medium text-text-primary">
                  {formatCurrency(summary?.paymentBreakdown?.[key] || 0)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Low Stock & Irregular Customers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Alert */}
        <div className="card-glass p-6">
          <h3 className="section-header mb-4 flex items-center gap-2">
            <AlertTriangle size={18} className="text-warning" /> Low Stock Products
          </h3>
          {(summary?.lowStockProducts?.length || 0) === 0 ? (
            <p className="text-text-secondary text-sm">All products are sufficiently stocked ✅</p>
          ) : (
            <div className="space-y-2">
              {summary.lowStockProducts.slice(0, 5).map((p: any) => (
                <div key={p.id} className="flex items-center justify-between text-sm">
                  <span className="text-text-primary font-medium">{p.name}</span>
                  <span className="badge-warning">Qty: {p.stockQty}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Irregular Customers */}
        <div className="card-glass p-6">
          <h3 className="section-header mb-4 flex items-center gap-2">
            <Users size={18} className="text-primary" /> Irregular Customers
            <span className="badge-rose ml-auto">30+ days away</span>
          </h3>
          {(summary?.irregularCustomers?.length || 0) === 0 ? (
            <p className="text-text-secondary text-sm">No inactive customers in the past 30 days 🎉</p>
          ) : (
            <div className="space-y-2">
              {summary.irregularCustomers.slice(0, 5).map((c: any) => (
                <div key={c.id} className="flex items-center justify-between text-sm">
                  <span className="text-text-primary font-medium">{c.name}</span>
                  <span className="text-text-secondary">{c.phone}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
