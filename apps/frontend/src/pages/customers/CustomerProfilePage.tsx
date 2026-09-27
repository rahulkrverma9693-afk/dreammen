import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  User, Phone, Mail, MapPin, Calendar, Wallet, Award,
  Receipt, Clock, Package, Sparkles, Plus, ArrowLeft,
  FileText, CheckCircle2, Star, CreditCard,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import api from '../../utils/api';
import { MOCK_CUSTOMERS } from '../../utils/mockData';
import { formatCurrency, formatDateTime } from '../../utils/cn';

export default function CustomerProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Find customer or fallback to first mock
  const customer = MOCK_CUSTOMERS.find((c) => c.id === id) || MOCK_CUSTOMERS[0];

  const [activeTab, setActiveTab] = useState<'VISITS' | 'WALLET' | 'PACKAGES' | 'MEMBERSHIP'>('VISITS');
  const [walletAmount, setWalletAmount] = useState<number>(500);
  const [showTopupModal, setShowTopupModal] = useState<boolean>(false);
  const [walletBalance, setWalletBalance] = useState<number>(customer.walletBalance);

  // Mock Visit & Bill History
  const [visitHistory] = useState([
    { id: 'b-101', billNumber: 'DG-2026-0045', date: '2026-08-05T14:30:00Z', billType: 'SERVICE', netPayable: 2350, paymentStatus: 'PAID', itemsCount: 2, items: 'Global Hair Colouring, Blowdry' },
    { id: 'b-102', billNumber: 'DG-2026-0028', date: '2026-07-22T11:00:00Z', billType: 'SERVICE', netPayable: 1200, paymentStatus: 'PAID', itemsCount: 1, items: 'O3+ Facial Glow' },
    { id: 'b-103', billNumber: 'DG-2026-0010', date: '2026-06-15T16:15:00Z', billType: 'PRODUCT', netPayable: 950, paymentStatus: 'PAID', itemsCount: 1, items: 'L\'Oreal Hair Spa Mask' },
  ]);

  // Mock Wallet Log
  const [walletLog, setWalletLog] = useState([
    { id: 'w-1', type: 'CREDIT', amount: 500, balance: customer.walletBalance, reason: 'Cashback credited on bill DG-2026-0045', date: '2026-08-05' },
    { id: 'w-2', type: 'DEBIT', amount: 300, balance: customer.walletBalance - 500, reason: 'Redeemed on bill DG-2026-0028', date: '2026-07-22' },
    { id: 'w-3', type: 'CREDIT', amount: 1000, balance: customer.walletBalance - 200, reason: 'Manual Wallet Top Up (Cash)', date: '2026-06-01' },
  ]);

  const handleTopupWallet = async () => {
    if (!walletAmount || walletAmount <= 0) return;
    try {
      const res = await api.post(`/customers/${id}/wallet/credit`, {
        amount: walletAmount,
        reason: 'Manual Wallet Recharge (Admin)',
      });
      const updated = res.data.data;
      setWalletBalance(updated.walletBalance || (walletBalance + walletAmount));
      queryClient.invalidateQueries({ queryKey: ['customer', id] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success(`Recharged ₹${walletAmount} to ${customer.name}'s wallet! 💳`);
      setShowTopupModal(false);
    } catch {
      const newBal = walletBalance + walletAmount;
      setWalletBalance(newBal);
      toast.success(`Recharged ₹${walletAmount} to ${customer.name}'s wallet (Offline)! 💳`);
      setShowTopupModal(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Top Navigation */}
      <button
        onClick={() => navigate('/customers')}
        className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
      >
        <ArrowLeft size={16} /> Back to Customer CRM
      </button>

      {/* Customer Header Banner */}
      <div className="card-glass p-6 border-l-4 border-l-primary flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-rose-gradient text-white flex items-center justify-center font-heading font-bold text-2xl shadow-card">
            {customer.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-heading font-bold text-2xl text-text-primary">{customer.name}</h1>
              {customer.group && (
                <span className="badge-rose font-bold text-xs">{customer.group.name}</span>
              )}
            </div>
            <p className="text-xs text-text-secondary mt-1">
              ID: <span className="font-mono font-bold text-text-primary">{customer.customerId}</span> • Phone: {customer.phone} • Email: {customer.email || 'N/A'}
            </p>
            {customer.notes && (
              <p className="text-xs text-primary font-medium mt-1 bg-rose-panel/50 px-2 py-0.5 rounded w-fit">
                Note: {customer.notes}
              </p>
            )}
          </div>
        </div>

        {/* Right Stats Pills */}
        <div className="flex items-center gap-4 bg-gray-50 p-3 rounded-card border border-gray-200">
          <div className="text-center px-3 border-r border-gray-200">
            <p className="text-[10px] text-text-secondary uppercase font-semibold">Wallet Balance</p>
            <p className="font-heading font-bold text-lg text-primary">{formatCurrency(walletBalance)}</p>
          </div>
          <div className="text-center px-3 border-r border-gray-200">
            <p className="text-[10px] text-text-secondary uppercase font-semibold">Loyalty Points</p>
            <p className="font-heading font-bold text-lg text-amber-600">{customer.loyaltyPoints} pts</p>
          </div>
          <button
            onClick={() => setShowTopupModal(true)}
            className="btn-primary text-xs py-2 px-3 flex items-center gap-1"
          >
            <Plus size={14} /> Add Credit
          </button>
        </div>
      </div>

      {/* Profile Detail Tabs */}
      <div className="card-glass p-2 flex items-center gap-2 border border-primary-100">
        {[
          { id: 'VISITS',    label: 'Visit & Bill History', icon: Receipt },
          { id: 'WALLET',    label: 'Wallet Log',           icon: Wallet },
          { id: 'PACKAGES',  label: 'Active Packages',      icon: Package },
          { id: 'MEMBERSHIP',label: 'Memberships',         icon: Award },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as any)}
            className={`flex-1 py-2 px-3 rounded-card text-xs font-heading font-semibold flex items-center justify-center gap-2 transition-all ${
              activeTab === id
                ? 'bg-rose-gradient text-white shadow-card'
                : 'text-text-secondary hover:bg-rose-panel hover:text-primary'
            }`}
          >
            <Icon size={16} />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* TAB 1: VISITS & BILL HISTORY */}
      {activeTab === 'VISITS' && (
        <div className="card-glass p-4 space-y-4">
          <h3 className="section-header text-sm">Past Salon Bills ({visitHistory.length})</h3>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Bill Number</th>
                  <th>Date & Time</th>
                  <th>Bill Type</th>
                  <th>Services / Items</th>
                  <th>Net Payable</th>
                  <th>Status</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {visitHistory.map((bill) => (
                  <tr key={bill.id}>
                    <td className="font-mono text-xs font-bold text-primary">{bill.billNumber}</td>
                    <td className="text-xs">{formatDateTime(bill.date)}</td>
                    <td className="text-xs">{bill.billType}</td>
                    <td className="text-xs">{bill.items}</td>
                    <td className="font-heading font-bold text-xs">{formatCurrency(bill.netPayable)}</td>
                    <td><span className="badge-success">{bill.paymentStatus}</span></td>
                    <td className="text-right">
                      <button
                        onClick={() => navigate('/billing')}
                        className="btn-ghost text-xs py-1 px-2"
                      >
                        View Invoice
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: WALLET TRANSACTIONS */}
      {activeTab === 'WALLET' && (
        <div className="card-glass p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="section-header text-sm">Wallet Credit / Debit Log</h3>
            <button onClick={() => setShowTopupModal(true)} className="btn-primary text-xs py-1.5 px-3">
              + Top Up Wallet
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Balance After</th>
                  <th>Reason / Details</th>
                </tr>
              </thead>
              <tbody>
                {walletLog.map((log) => (
                  <tr key={log.id}>
                    <td className="text-xs">{log.date}</td>
                    <td>
                      <span className={log.type === 'CREDIT' ? 'badge-success' : 'badge-error'}>
                        {log.type}
                      </span>
                    </td>
                    <td className={`font-heading font-bold text-xs ${log.type === 'CREDIT' ? 'text-green-600' : 'text-red-600'}`}>
                      {log.type === 'CREDIT' ? '+' : '-'}{formatCurrency(log.amount)}
                    </td>
                    <td className="font-mono text-xs">{formatCurrency(log.balance)}</td>
                    <td className="text-xs">{log.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: PACKAGES */}
      {activeTab === 'PACKAGES' && (
        <div className="card-glass p-4 space-y-4">
          <h3 className="section-header text-sm">Active Spa & Combo Packs</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-white border border-gray-200 rounded-card space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <span className="badge-rose text-[10px]">SPA PACK</span>
                  <h4 className="font-heading font-bold text-sm text-text-primary mt-1">Aroma Massage 5-Session Pass</h4>
                </div>
                <span className="badge-success">ACTIVE</span>
              </div>
              <p className="text-xs text-text-secondary">Sessions: <strong className="text-primary font-bold">3 of 5 Remaining</strong></p>
              <p className="text-[10px] text-text-secondary">Purchased: 2026-06-15 • Expires: 2026-12-15</p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: MEMBERSHIP */}
      {activeTab === 'MEMBERSHIP' && (
        <div className="card-glass p-4 space-y-4">
          <h3 className="section-header text-sm">Active Memberships</h3>
          <div className="p-4 bg-rose-panel/50 border border-primary-200 rounded-card flex items-center justify-between">
            <div>
              <span className="badge-rose font-bold text-[10px]">20% OFF ALL SERVICES</span>
              <h4 className="font-heading font-bold text-base text-text-primary mt-1">DreamGirl Elite Annual Membership</h4>
              <p className="text-xs text-text-secondary">Valid until 2027-08-01 (350 days remaining)</p>
            </div>
            <span className="badge-success">ACTIVE</span>
          </div>
        </div>
      )}

      {/* Wallet Top-Up Modal */}
      {showTopupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-card shadow-2xl p-6 max-w-sm w-full space-y-4">
            <h3 className="font-heading font-bold text-lg text-text-primary">Top Up Wallet Balance</h3>
            <p className="text-xs text-text-secondary">Recharge credit into {customer.name}'s wallet.</p>

            <div>
              <label className="form-label">Recharge Amount (₹)</label>
              <input
                type="number"
                value={walletAmount}
                onChange={(e) => setWalletAmount(Number(e.target.value))}
                className="input-field font-bold text-lg text-primary"
                min={100}
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button onClick={() => setShowTopupModal(false)} className="btn-ghost text-xs">
                Cancel
              </button>
              <button onClick={handleTopupWallet} className="btn-primary text-xs py-2 px-4">
                Confirm Top Up
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}