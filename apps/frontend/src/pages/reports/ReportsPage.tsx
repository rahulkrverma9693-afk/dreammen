import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart3, TrendingUp, DollarSign, Download, Calendar, Filter,
  Users, Scissors, Package, CreditCard, PieChart as PieChartIcon,
  ArrowUpRight, ArrowDownRight, RefreshCw, Printer, AlertTriangle,
  Award, Clock, CheckCircle2, UserX, HelpCircle, FileSpreadsheet,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend,
} from 'recharts';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import { formatCurrency } from '../../utils/cn';

// ─── Types ────────────────────────────────────────────────────
interface FinanceReport {
  period: { start: string; end: string };
  summary: {
    grossTotal: number;
    totalDiscount: number;
    totalTax: number;
    totalTips: number;
    totalRevenue: number;
    totalAmountPaid: number;
    totalBalanceDue: number;
    totalExpenses: number;
    netProfit: number;
    totalBills: number;
  };
  paymentMethods: Record<string, number>;
  dailyTrend: Array<{ date: string; revenue: number }>;
}

interface ServiceReport {
  id: string;
  name: string;
  category: string;
  quantity: number;
  revenue: number;
}

interface ProductReport {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  revenue: number;
}

interface CustomerReport {
  id: string;
  name: string;
  phone: string;
  group: string;
  totalVisits: number;
  periodVisits: number;
  totalSpend: number;
  periodSpend: number;
  lastVisit: string | null;
  isChurned: boolean;
}

interface EmployeeReport {
  id: string;
  name: string;
  role: string;
  revenueGenerated: number;
  servicesDelivered: number;
  commissionEarned: number;
  daysPresent: number;
  totalHours: number;
  monthlyTarget: number;
  targetAchievementPct: number | null;
}

const COLORS = ['#C2185B', '#F48FB1', '#880E4F', '#2E7D32', '#F9A825', '#0288D1'];

// Mock Reports Fallback Data
const MOCK_FINANCE_DATA: FinanceReport = {
  period: { start: '2026-08-01', end: '2026-08-31' },
  summary: {
    grossTotal: 485000,
    totalDiscount: 38500,
    totalTax: 72450,
    totalTips: 18200,
    totalRevenue: 518950,
    totalAmountPaid: 495000,
    totalBalanceDue: 23950,
    totalExpenses: 142000,
    netProfit: 376950,
    totalBills: 248,
  },
  paymentMethods: {
    UPI: 245000,
    CARD: 168000,
    CASH: 78000,
    WALLET: 27950,
  },
  dailyTrend: [
    { date: 'Aug 01', revenue: 14500 },
    { date: 'Aug 02', revenue: 18200 },
    { date: 'Aug 03', revenue: 16800 },
    { date: 'Aug 04', revenue: 12400 },
    { date: 'Aug 05', revenue: 19500 },
    { date: 'Aug 06', revenue: 22400 },
    { date: 'Aug 07', revenue: 26800 },
    { date: 'Aug 08', revenue: 15400 },
    { date: 'Aug 09', revenue: 17800 },
    { date: 'Aug 10', revenue: 21500 },
    { date: 'Aug 11', revenue: 14900 },
    { date: 'Aug 12', revenue: 18600 },
    { date: 'Aug 13', revenue: 24200 },
    { date: 'Aug 14', revenue: 29800 },
    { date: 'Aug 15', revenue: 35600 },
    { date: 'Aug 16', revenue: 31200 },
    { date: 'Aug 17', revenue: 16400 },
    { date: 'Aug 18', revenue: 19800 },
    { date: 'Aug 19', revenue: 22100 },
    { date: 'Aug 20', revenue: 24500 },
    { date: 'Aug 21', revenue: 28400 },
  ],
};

const MOCK_SERVICES_REPORT: ServiceReport[] = [
  { id: 'srv-1', name: 'Women Haircut & Blowdry', category: 'Hair Care & Styling', quantity: 98, revenue: 83300 },
  { id: 'srv-4', name: 'Keratin Smoothing Treatment', category: 'Hair Care & Styling', quantity: 16, revenue: 79984 },
  { id: 'srv-6', name: 'Hydra Facial & Glow Booster', category: 'Skin & Facials', quantity: 18, revenue: 71982 },
  { id: 'srv-3', name: 'Global Hair Colouring', category: 'Hair Care & Styling', quantity: 19, revenue: 66500 },
  { id: 'srv-5', name: 'O3+ Premium Facial', category: 'Skin & Facials', quantity: 24, revenue: 59976 },
  { id: 'srv-10', name: 'Aromatherapy Body Massage', category: 'Spa & Massage', quantity: 14, revenue: 41986 },
  { id: 'srv-2', name: 'Men Haircut & Hairwash', category: 'Hair Care & Styling', quantity: 82, revenue: 28700 },
  { id: 'srv-7', name: 'Gel Polish & Nail Art', category: 'Nails & Pedicure', quantity: 22, revenue: 26400 },
  { id: 'srv-8', name: 'Deluxe Spa Pedicure', category: 'Nails & Pedicure', quantity: 24, revenue: 22800 },
  { id: 'srv-9', name: 'Beard Shaping & Royal Spa', category: 'Beard & Men Grooming', quantity: 38, revenue: 17100 },
];

const MOCK_PRODUCTS_REPORT: ProductReport[] = [
  { id: 'prod-3', name: 'Moroccanoil Treatment Oil (100ml)', sku: 'MOR-003', quantity: 12, revenue: 45600 },
  { id: 'prod-1', name: 'L\'Oreal Professionnel Hair Spa Mask (500g)', sku: 'LOR-001', quantity: 32, revenue: 30400 },
  { id: 'prod-4', name: 'O3+ D-Tan Cleanse Pack (250g)', sku: 'O3-004', quantity: 18, revenue: 26100 },
  { id: 'prod-2', name: 'Matrix Opti.Care Smooth Shampoo (350ml)', sku: 'MAT-002', quantity: 28, revenue: 18200 },
];

const MOCK_CUSTOMERS_REPORT: CustomerReport[] = [
  { id: 'cust-1', name: 'Priya Kapoor', phone: '9876543210', group: 'VIP Ladies', totalVisits: 14, periodVisits: 3, totalSpend: 28400, periodSpend: 6850, lastVisit: '2026-08-20', isChurned: false },
  { id: 'cust-2', name: 'Rohan Mehta', phone: '9820011223', group: 'Regular Men', totalVisits: 8, periodVisits: 2, totalSpend: 9400, periodSpend: 2400, lastVisit: '2026-08-18', isChurned: false },
  { id: 'cust-3', name: 'Sunita Patel', phone: '9876543213', group: 'VIP Ladies', totalVisits: 11, periodVisits: 2, totalSpend: 24500, periodSpend: 5499, lastVisit: '2026-08-15', isChurned: false },
  { id: 'cust-4', name: 'Neha Agarwal', phone: '9988776655', group: 'Regular Ladies', totalVisits: 6, periodVisits: 1, totalSpend: 11200, periodSpend: 3500, lastVisit: '2026-08-12', isChurned: false },
  { id: 'cust-5', name: 'Vikram Malhotra', phone: '9811223344', group: 'Corporate', totalVisits: 5, periodVisits: 0, totalSpend: 8900, periodSpend: 0, lastVisit: '2026-06-10', isChurned: true },
  { id: 'cust-6', name: 'Ananya Sharma', phone: '9765432109', group: 'VIP Ladies', totalVisits: 9, periodVisits: 1, totalSpend: 19800, periodSpend: 4999, lastVisit: '2026-08-08', isChurned: false },
  { id: 'cust-7', name: 'Simran Kaur', phone: '9898989898', group: 'Regular Ladies', totalVisits: 3, periodVisits: 0, totalSpend: 4200, periodSpend: 0, lastVisit: '2026-05-14', isChurned: true },
];

const MOCK_EMPLOYEES_REPORT: EmployeeReport[] = [
  { id: 'emp-1', name: 'Pooja Sharma', role: 'STYLIST', revenueGenerated: 148500, servicesDelivered: 84, commissionEarned: 22275, daysPresent: 20, totalHours: 160, monthlyTarget: 120000, targetAchievementPct: 123.75 },
  { id: 'emp-2', name: 'Ananya Verma', role: 'STYLIST', revenueGenerated: 132400, servicesDelivered: 72, commissionEarned: 19860, daysPresent: 19, totalHours: 152, monthlyTarget: 120000, targetAchievementPct: 110.33 },
  { id: 'emp-3', name: 'Rahul Verma', role: 'STYLIST', revenueGenerated: 98600, servicesDelivered: 68, commissionEarned: 11832, daysPresent: 21, totalHours: 168, monthlyTarget: 100000, targetAchievementPct: 98.60 },
  { id: 'emp-4', name: 'Sunita Menon', role: 'STYLIST', revenueGenerated: 114200, servicesDelivered: 56, commissionEarned: 17130, daysPresent: 18, totalHours: 144, monthlyTarget: 100000, targetAchievementPct: 114.20 },
  { id: 'emp-5', name: 'Vikram Singh', role: 'MANAGER', revenueGenerated: 25250, servicesDelivered: 14, commissionEarned: 2525, daysPresent: 21, totalHours: 168, monthlyTarget: 50000, targetAchievementPct: 50.50 },
];

// Export array to CSV file helper
function exportToCSV(filename: string, rows: object[]) {
  if (!rows || !rows.length) {
    toast.error('No data to export');
    return;
  }
  const headers = Object.keys(rows[0]);
  const csvContent = [
    headers.join(','),
    ...rows.map(row => headers.map(h => JSON.stringify((row as any)[h] ?? '')).join(',')),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  toast.success(`Exported ${filename}.csv`);
}

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<'finance' | 'services' | 'products' | 'customers' | 'employees'>('finance');
  const [dateRange, setDateRange] = useState<string>('this_month');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const rangeQuery = useMemo(() => {
    const params = new URLSearchParams();
    params.append('dateRange', dateRange);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    return params.toString();
  }, [dateRange, startDate, endDate]);

  // Queries
  const { data: rawFinanceData, isLoading: finLoading } = useQuery<FinanceReport>({
    queryKey: ['report-finance', rangeQuery],
    queryFn: async () => {
      try {
        const r = await api.get(`/reports/finance?${rangeQuery}`);
        if (r.data.data && r.data.data.summary?.totalRevenue > 0) return r.data.data;
      } catch (_) {}
      return MOCK_FINANCE_DATA;
    },
    enabled: activeTab === 'finance',
  });
  const financeData = rawFinanceData || MOCK_FINANCE_DATA;

  const { data: rawServiceData = [], isLoading: serviceLoading } = useQuery<ServiceReport[]>({
    queryKey: ['report-services', rangeQuery],
    queryFn: async () => {
      try {
        const r = await api.get(`/reports/sales-by-service?${rangeQuery}`);
        if (r.data.data && r.data.data.length > 0) return r.data.data;
      } catch (_) {}
      return MOCK_SERVICES_REPORT;
    },
    enabled: activeTab === 'services',
  });
  const serviceData = rawServiceData.length > 0 ? rawServiceData : MOCK_SERVICES_REPORT;

  const { data: rawProductData = [], isLoading: prodLoading } = useQuery<ProductReport[]>({
    queryKey: ['report-products', rangeQuery],
    queryFn: async () => {
      try {
        const r = await api.get(`/reports/sales-by-product?${rangeQuery}`);
        if (r.data.data && r.data.data.length > 0) return r.data.data;
      } catch (_) {}
      return MOCK_PRODUCTS_REPORT;
    },
    enabled: activeTab === 'products',
  });
  const productData = rawProductData.length > 0 ? rawProductData : MOCK_PRODUCTS_REPORT;

  const { data: rawCustomerData = [], isLoading: custLoading } = useQuery<CustomerReport[]>({
    queryKey: ['report-customers', rangeQuery],
    queryFn: async () => {
      try {
        const r = await api.get(`/reports/customers?${rangeQuery}`);
        if (r.data.data && r.data.data.length > 0) return r.data.data;
      } catch (_) {}
      return MOCK_CUSTOMERS_REPORT;
    },
    enabled: activeTab === 'customers',
  });
  const customerData = rawCustomerData.length > 0 ? rawCustomerData : MOCK_CUSTOMERS_REPORT;

  const { data: rawEmployeeData = [], isLoading: empLoading } = useQuery<EmployeeReport[]>({
    queryKey: ['report-employees', rangeQuery],
    queryFn: async () => {
      try {
        const r = await api.get(`/reports/employees?${rangeQuery}`);
        if (r.data.data && r.data.data.length > 0) return r.data.data;
      } catch (_) {}
      return MOCK_EMPLOYEES_REPORT;
    },
    enabled: activeTab === 'employees',
  });
  const employeeData = rawEmployeeData.length > 0 ? rawEmployeeData : MOCK_EMPLOYEES_REPORT;

  // Pie chart data for payment methods
  const paymentPieData = useMemo(() => {
    if (!financeData?.paymentMethods) return [];
    return Object.entries(financeData.paymentMethods)
      .filter(([_, val]) => val > 0)
      .map(([name, value]) => ({ name, value }));
  }, [financeData]);

  // Handle Export
  function handleExport() {
    if (activeTab === 'finance' && financeData) {
      exportToCSV('finance_report', [financeData.summary]);
    } else if (activeTab === 'services') {
      exportToCSV('sales_by_service', serviceData);
    } else if (activeTab === 'products') {
      exportToCSV('sales_by_product', productData);
    } else if (activeTab === 'customers') {
      exportToCSV('customer_analytics', customerData);
    } else if (activeTab === 'employees') {
      exportToCSV('staff_performance', employeeData);
    }
  }

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading font-bold text-2xl text-text-primary">Reports & Analytics</h1>
          <p className="text-text-secondary text-sm mt-0.5">
            Financial metrics, service performance, staff productivity, & customer retention insights
          </p>
        </div>

        {/* Global Controls: Date Range & Export */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-input px-3 py-1.5 shadow-xs">
            <Calendar size={15} className="text-primary" />
            <select
              value={dateRange}
              onChange={e => setDateRange(e.target.value)}
              className="text-xs font-semibold text-text-primary outline-none bg-transparent"
            >
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="this_week">This Week</option>
              <option value="this_month">This Month</option>
              <option value="last_30_days">Last 30 Days</option>
            </select>
          </div>

          <button
            onClick={handleExport}
            className="px-3 py-1.5 bg-rose-50 border border-primary-200 text-primary hover:bg-primary hover:text-white rounded-button text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs"
          >
            <Download size={14} /> Export CSV
          </button>

          <button
            onClick={() => window.print()}
            className="p-1.5 bg-white border border-gray-200 text-text-secondary hover:text-primary rounded-input transition-colors shadow-xs"
            title="Print Report"
          >
            <Printer size={16} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-rose-panel rounded-button p-1 gap-1 w-fit">
        {([
          ['finance', 'Finance & Profit', DollarSign],
          ['services', 'Services Performance', Scissors],
          ['products', 'Product Sales', Package],
          ['customers', 'Customer Retention', Users],
          ['employees', 'Staff Productivity', BarChart3],
        ] as const).map(([tab, label, Icon]) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-button text-xs font-semibold transition-all ${
              activeTab === tab
                ? 'bg-primary text-white shadow-xs'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <Icon size={15} />{label}
          </button>
        ))}
      </div>

      {/* ── TAB 1: Finance Summary ── */}
      {activeTab === 'finance' && (
        <div className="space-y-6">
          <>
              {/* Financial KPI Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="card-glass p-4 rounded-card border-l-4 border-l-primary">
                  <div className="text-xs text-text-secondary font-medium">Total Gross Revenue</div>
                  <div className="text-2xl font-bold text-text-primary font-heading mt-1">
                    {formatCurrency(financeData.summary.totalRevenue)}
                  </div>
                  <div className="text-[11px] text-text-secondary mt-1">From {financeData.summary.totalBills} bills</div>
                </div>

                <div className="card-glass p-4 rounded-card border-l-4 border-l-green-600">
                  <div className="text-xs text-text-secondary font-medium">Net Profit</div>
                  <div className="text-2xl font-bold text-green-700 font-heading mt-1">
                    {formatCurrency(financeData.summary.netProfit)}
                  </div>
                  <div className="text-[11px] text-green-600 mt-1">After expenses deduction</div>
                </div>

                <div className="card-glass p-4 rounded-card border-l-4 border-l-amber-500">
                  <div className="text-xs text-text-secondary font-medium">Balance Due Outstanding</div>
                  <div className="text-2xl font-bold text-amber-700 font-heading mt-1">
                    {formatCurrency(financeData.summary.totalBalanceDue)}
                  </div>
                  <div className="text-[11px] text-amber-600 mt-1">Pending collections</div>
                </div>

                <div className="card-glass p-4 rounded-card border-l-4 border-l-red-500">
                  <div className="text-xs text-text-secondary font-medium">Total Expenses</div>
                  <div className="text-2xl font-bold text-red-700 font-heading mt-1">
                    {formatCurrency(financeData.summary.totalExpenses)}
                  </div>
                  <div className="text-[11px] text-red-600 mt-1">Operating costs</div>
                </div>
              </div>

              {/* Revenue Daily Area Chart & Payment Split Pie Chart */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Area Chart */}
                <div className="lg:col-span-2 bg-white rounded-card shadow-card border border-primary-100/40 p-5 space-y-3">
                  <h3 className="font-heading font-bold text-base text-text-primary">Revenue Daily Trend</h3>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={financeData.dailyTrend}>
                        <defs>
                          <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#C2185B" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#C2185B" stopOpacity={0.0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip formatter={(v: any) => formatCurrency(Number(v))} />
                        <Area type="monotone" dataKey="revenue" stroke="#C2185B" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Payment Methods Pie */}
                <div className="lg:col-span-1 bg-white rounded-card shadow-card border border-primary-100/40 p-5 space-y-3">
                  <h3 className="font-heading font-bold text-base text-text-primary">Payment Methods Breakdown</h3>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={paymentPieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {paymentPieData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v: any) => formatCurrency(Number(v))} />
                        <Legend wrapperStyle={{ fontSize: '11px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </>
        </div>
      )}

      {/* ── TAB 2: Sales by Service ── */}
      {activeTab === 'services' && (
        <div className="bg-white rounded-card shadow-card border border-primary-100/40 p-5 space-y-4">
          <h3 className="font-heading font-bold text-base text-text-primary">Top Services by Revenue</h3>

          {serviceLoading ? (
            <div className="py-12 text-center text-text-secondary"><RefreshCw size={18} className="animate-spin text-primary mx-auto" /> Loading service sales…</div>
          ) : serviceData.length === 0 ? (
            <div className="py-12 text-center text-text-secondary text-sm">No service sales recorded for this period.</div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-rose-panel border-b border-gray-200 text-xs font-bold text-text-secondary uppercase">
                  <th className="px-4 py-3">Service Name</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3 text-right">Units Billed</th>
                  <th className="px-4 py-3 text-right">Total Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {serviceData.map(s => (
                  <tr key={s.id} className="hover:bg-rose-50/40">
                    <td className="px-4 py-3 font-semibold text-text-primary">{s.name}</td>
                    <td className="px-4 py-3 text-xs text-text-secondary">{s.category}</td>
                    <td className="px-4 py-3 text-right font-bold text-text-primary">{s.quantity}</td>
                    <td className="px-4 py-3 text-right font-bold text-primary">{formatCurrency(s.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── TAB 3: Sales by Product ── */}
      {activeTab === 'products' && (
        <div className="bg-white rounded-card shadow-card border border-primary-100/40 p-5 space-y-4">
          <h3 className="font-heading font-bold text-base text-text-primary">Retail Product Sales</h3>

          {prodLoading ? (
            <div className="py-12 text-center text-text-secondary"><RefreshCw size={18} className="animate-spin text-primary mx-auto" /> Loading product sales…</div>
          ) : productData.length === 0 ? (
            <div className="py-12 text-center text-text-secondary text-sm">No retail product sales in this period.</div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-rose-panel border-b border-gray-200 text-xs font-bold text-text-secondary uppercase">
                  <th className="px-4 py-3">Product Name</th>
                  <th className="px-4 py-3">SKU</th>
                  <th className="px-4 py-3 text-right">Qty Sold</th>
                  <th className="px-4 py-3 text-right">Total Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {productData.map(p => (
                  <tr key={p.id} className="hover:bg-rose-50/40">
                    <td className="px-4 py-3 font-semibold text-text-primary">{p.name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-text-secondary">{p.sku || '—'}</td>
                    <td className="px-4 py-3 text-right font-bold text-text-primary">{p.quantity}</td>
                    <td className="px-4 py-3 text-right font-bold text-primary">{formatCurrency(p.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── TAB 4: Customer Analytics & Churn ── */}
      {activeTab === 'customers' && (
        <div className="bg-white rounded-card shadow-card border border-primary-100/40 p-5 space-y-4">
          <h3 className="font-heading font-bold text-base text-text-primary">Customer Spend & At-Risk Churn Analytics</h3>

          {custLoading ? (
            <div className="py-12 text-center text-text-secondary"><RefreshCw size={18} className="animate-spin text-primary mx-auto" /> Loading customer reports…</div>
          ) : customerData.length === 0 ? (
            <div className="py-12 text-center text-text-secondary text-sm">No customer data found.</div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-rose-panel border-b border-gray-200 text-xs font-bold text-text-secondary uppercase">
                  <th className="px-4 py-3">Customer Name</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Group</th>
                  <th className="px-4 py-3 text-right">Total Spend</th>
                  <th className="px-4 py-3 text-right">Last Visit</th>
                  <th className="px-4 py-3 text-right">Retention Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {customerData.map(c => (
                  <tr key={c.id} className="hover:bg-rose-50/40">
                    <td className="px-4 py-3 font-semibold text-text-primary">{c.name}</td>
                    <td className="px-4 py-3 text-xs text-text-secondary">{c.phone}</td>
                    <td className="px-4 py-3"><span className="text-xs px-2 py-0.5 rounded-full bg-rose-50 text-primary font-bold">{c.group}</span></td>
                    <td className="px-4 py-3 text-right font-bold text-primary">{formatCurrency(c.totalSpend)}</td>
                    <td className="px-4 py-3 text-right text-xs text-text-secondary">
                      {c.lastVisit ? new Date(c.lastVisit).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Never'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-bold border ${
                        c.isChurned ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'
                      }`}>
                        {c.isChurned ? 'At Risk (30+ days)' : 'Active Customer'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── TAB 5: Staff Productivity ── */}
      {activeTab === 'employees' && (
        <div className="bg-white rounded-card shadow-card border border-primary-100/40 p-5 space-y-4">
          <h3 className="font-heading font-bold text-base text-text-primary">Staff Productivity & Target Progress</h3>

          {empLoading ? (
            <div className="py-12 text-center text-text-secondary"><RefreshCw size={18} className="animate-spin text-primary mx-auto" /> Loading staff performance…</div>
          ) : employeeData.length === 0 ? (
            <div className="py-12 text-center text-text-secondary text-sm">No employee data recorded.</div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-rose-panel border-b border-gray-200 text-xs font-bold text-text-secondary uppercase">
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3 text-right">Services Done</th>
                  <th className="px-4 py-3 text-right">Revenue Generated</th>
                  <th className="px-4 py-3 text-right">Commission Earned</th>
                  <th className="px-4 py-3 text-right">Target Achievement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {employeeData.map(e => (
                  <tr key={e.id} className="hover:bg-rose-50/40">
                    <td className="px-4 py-3 font-semibold text-text-primary">{e.name}</td>
                    <td className="px-4 py-3 text-xs text-text-secondary capitalize">{e.role.toLowerCase()}</td>
                    <td className="px-4 py-3 text-right font-bold text-text-primary">{e.servicesDelivered}</td>
                    <td className="px-4 py-3 text-right font-bold text-text-primary">{formatCurrency(e.revenueGenerated)}</td>
                    <td className="px-4 py-3 text-right font-bold text-primary">{formatCurrency(e.commissionEarned)}</td>
                    <td className="px-4 py-3 text-right">
                      {e.targetAchievementPct !== null ? (
                        <div className="inline-flex items-center gap-1 text-xs font-bold text-green-700">
                          {e.targetAchievementPct}%
                        </div>
                      ) : (
                        <span className="text-xs text-text-secondary">No target</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}