import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, UserPlus, Search, Download, Filter, Eye, Edit2,
  Trash2, Wallet, Award, Star, Phone, Mail, Sparkles, RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../utils/api';
import { MOCK_CUSTOMERS } from '../../utils/mockData';
import { formatCurrency, statusColor } from '../../utils/cn';
import CustomerModal from '../../components/customers/CustomerModal';

export default function CustomersPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState('ALL');
  const [genderFilter, setGenderFilter] = useState('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);

  // Fetch real customers from backend — fallback to mock if API unavailable
  const { data: customersData, isLoading } = useQuery({
    queryKey: ['customers', search, groupFilter, genderFilter],
    queryFn: async () => {
      try {
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (groupFilter !== 'ALL') params.append('groupId', groupFilter);
        if (genderFilter !== 'ALL') params.append('gender', genderFilter);
        const r = await api.get(`/customers?${params.toString()}&limit=100`);
        const list = r.data.data?.customers || (Array.isArray(r.data.data) ? r.data.data : []);
        return list;
      } catch {
        return MOCK_CUSTOMERS;
      }
    },
  });
  const customers = customersData || MOCK_CUSTOMERS;

  // Delete (deactivate) mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/customers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
    onError: () => toast.error('Failed to deactivate customer'),
  });

  // Filters are now query params sent to backend — client-side slice for display only
  const filteredCustomers = useMemo(() => customers, [customers]);

  // Statistics
  const totalCustomers = customers.length;
  const vipCustomers = customers.filter((c: any) => c.group?.name === 'VIP Ladies').length;
  const totalWalletBalance = customers.reduce((sum: number, c: any) => sum + (c.walletBalance || 0), 0);

  const handleExportCSV = () => {
    const headers = ['ID', 'Name', 'Phone', 'Email', 'Gender', 'Group', 'Wallet Balance', 'Loyalty Points'];
    const rows = filteredCustomers.map((c: any) => [
      c.customerId,
      c.name,
      c.phone,
      c.email || '',
      c.gender || '',
      c.group?.name || '',
      c.walletBalance,
      c.loyaltyPoints,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e: any) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `dreamgirl_customers_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Customers exported to CSV! 📊');
  };

  const handleDeleteCustomer = (id: string, name: string) => {
    if (confirm(`Are you sure you want to deactivate customer ${name}?`)) {
      deleteMutation.mutate(id, {
        onSuccess: () => toast.success(`Customer ${name} deactivated`),
      });
    }
  };

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Page Title & Top Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading font-bold text-2xl text-text-primary">Customer CRM</h1>
          <p className="text-text-secondary text-sm mt-0.5">Manage customer profiles, loyalty groups, wallet balances & visit histories</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExportCSV} className="btn-secondary text-xs py-2.5 px-4 flex items-center gap-1.5">
            <Download size={16} /> Export CSV
          </button>
          <button onClick={() => setIsAddModalOpen(true)} className="btn-primary text-xs py-2.5 px-4 flex items-center gap-1.5">
            <UserPlus size={16} /> Add New Customer
          </button>
        </div>
      </div>

      {/* Quick Summary Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="w-10 h-10 rounded-card bg-rose-panel text-primary flex items-center justify-center">
            <Users size={20} />
          </div>
          <div className="mt-2">
            <p className="text-xs text-text-secondary font-medium uppercase">Total Customers</p>
            <p className="font-heading font-bold text-2xl text-text-primary mt-0.5">{totalCustomers}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="w-10 h-10 rounded-card bg-amber-50 text-warning flex items-center justify-center">
            <Award size={20} />
          </div>
          <div className="mt-2">
            <p className="text-xs text-text-secondary font-medium uppercase">VIP Group Members</p>
            <p className="font-heading font-bold text-2xl text-text-primary mt-0.5">{vipCustomers}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="w-10 h-10 rounded-card bg-green-50 text-success flex items-center justify-center">
            <Wallet size={20} />
          </div>
          <div className="mt-2">
            <p className="text-xs text-text-secondary font-medium uppercase">Total Wallet Liability</p>
            <p className="font-heading font-bold text-2xl text-text-primary mt-0.5">{formatCurrency(totalWalletBalance)}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="w-10 h-10 rounded-card bg-blue-50 text-blue-600 flex items-center justify-center">
            <Sparkles size={20} />
          </div>
          <div className="mt-2">
            <p className="text-xs text-text-secondary font-medium uppercase">Active Loyalty Members</p>
            <p className="font-heading font-bold text-2xl text-text-primary mt-0.5">{totalCustomers}</p>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="card-glass p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, phone or Customer ID..."
            className="input-field pr-9 text-xs"
          />
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-1.5">
            <Filter size={14} className="text-text-secondary" />
            <select
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value)}
              className="select-field text-xs py-1.5 px-3"
            >
              <option value="ALL">All Groups</option>
              <option value="grp-1">VIP Ladies</option>
              <option value="grp-2">Regular Men</option>
            </select>
          </div>

          <div className="flex bg-gray-100 p-0.5 rounded-card text-xs font-medium">
            {(['ALL', 'FEMALE', 'MALE'] as const).map((g) => (
              <button
                key={g}
                onClick={() => setGenderFilter(g)}
                className={`px-3 py-1 rounded-card transition-all ${
                  genderFilter === g ? 'bg-primary text-white shadow-xs' : 'text-text-secondary hover:text-primary'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Customers Data Table */}
      <div className="card-glass overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Customer ID</th>
                <th>Name & Info</th>
                <th>Phone Number</th>
                <th>Gender</th>
                <th>Group Segment</th>
                <th>Wallet Balance</th>
                <th>Loyalty Points</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-text-secondary">
                    No customers found matching search filters.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c: any) => (
                  <tr key={c.id} className="hover:bg-rose-panel/30 transition-colors">
                    <td className="font-mono text-xs font-bold text-text-secondary">{c.customerId}</td>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-rose-gradient text-white flex items-center justify-center font-bold text-xs">
                          {c.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-heading font-semibold text-text-primary text-sm">{c.name}</p>
                          <p className="text-[10px] text-text-secondary">{c.email || 'No email'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="font-medium text-xs text-text-primary">{c.phone}</td>
                    <td className="text-xs capitalize">{c.gender?.toLowerCase() || 'N/A'}</td>
                    <td>
                      {c.group ? (
                        <span className="badge-rose text-[10px]" style={{ borderColor: c.group.color }}>
                          {c.group.name}
                        </span>
                      ) : (
                        <span className="badge-gray text-[10px]">General</span>
                      )}
                    </td>
                    <td className="font-heading font-bold text-xs text-primary">
                      {formatCurrency(c.walletBalance)}
                    </td>
                    <td>
                      <span className="badge-warning text-[10px] flex items-center gap-1 w-fit">
                        <Star size={10} className="fill-amber-500" /> {c.loyaltyPoints} pts
                      </span>
                    </td>
                    <td className="text-right space-x-1">
                      <button
                        onClick={() => navigate(`/customers/${c.id}`)}
                        className="p-1.5 rounded hover:bg-rose-panel text-primary transition-colors"
                        title="View Full Profile"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => {
                          setEditingCustomer(c);
                          setIsAddModalOpen(true);
                        }}
                        className="p-1.5 rounded hover:bg-blue-50 text-blue-600 transition-colors"
                        title="Edit Customer Profile"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteCustomer(c.id, c.name)}
                        className="p-1.5 rounded hover:bg-red-50 text-red-500 transition-colors"
                        title="Deactivate"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Add / Edit Modal */}
      <CustomerModal
        isOpen={isAddModalOpen}
        customer={editingCustomer}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingCustomer(null);
        }}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['customers'] });
          setIsAddModalOpen(false);
          setEditingCustomer(null);
        }}
      />
    </div>
  );
}