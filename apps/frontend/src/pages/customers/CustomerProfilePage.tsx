import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  User, Phone, Mail, MapPin, Calendar, Wallet, Award,
  Receipt, Clock, Package, Sparkles, Plus, ArrowLeft,
  FileText, CheckCircle2, Star, CreditCard, AlertCircle, RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../utils/api';
import { formatCurrency, formatDateTime } from '../../utils/cn';

export default function CustomerProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'VISITS' | 'WALLET' | 'PACKAGES' | 'MEMBERSHIP'>('VISITS');
  const [walletAmount, setWalletAmount] = useState<number>(500);
  const [showTopupModal, setShowTopupModal] = useState<boolean>(false);
  const [isTopupLoading, setIsTopupLoading] = useState<boolean>(false);

  // ── Fetch real customer data from API ──────────────────────────────
  const {
    data: customer,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['customer', id],
    queryFn: async () => {
      const res = await api.get(`/customers/${id}`);
      return res.data.data;
    },
    enabled: !!id,
    retry: 2,
  });

  const handleTopupWallet = async () => {
    if (!walletAmount || walletAmount <= 0) return;
    setIsTopupLoading(true);
    try {
      // Use the correct backend route: POST /packages/topup-wallet
      const res = await api.post('/packages/topup-wallet', {
        customerId: id,
        amount: walletAmount,
        reason: 'Manual Wallet Recharge (Admin)',
      });
      const txn = res.data.data;
      toast.success(`Recharged ₹${walletAmount} to ${customer?.name}'s wallet! 💳`);
      setShowTopupModal(false);
      // Refresh customer data to show updated wallet balance
      queryClient.invalidateQueries({ queryKey: ['customer', id] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    } catch (err: any) {
      // SECURITY: Wallet top-up failures must NOT update the UI balance.
      // If the server rejected the transaction, the money was not added.
      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Wallet top-up failed. Please try again.';
      toast.error(message);
    } finally {
      setIsTopupLoading(false);
    }
  };

  // ── Loading state ──────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-text-secondary text-sm">Loading customer profile…</p>
        </div>
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────
  if (error || !customer) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4 max-w-sm">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
          <h2 className="font-heading font-semibold text-lg text-text-primary">Unable to load customer</h2>
          <p className="text-text-secondary text-sm">
            {(error as any)?.response?.data?.message || 'Customer not found or you do not have access.'}
          </p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => navigate('/customers')} className="btn-outline text-sm">
              <ArrowLeft size={14} /> Back to CRM
            </button>
            <button onClick={() => refetch()} className="btn-primary text-sm">
              <RefreshCw size={14} /> Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

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
              {customer.loyaltyPoints > 0 && (
                <span className="badge-primary text-xs flex items-center gap-1">
                  <Star size={10} /> {customer.loyaltyPoints} pts
                </span>
              )}
            </div>
            <p className="text-sm text-text-secondary">{customer.customerId}</p>
            <div className="flex items-center gap-4 mt-1 text-sm text-text-secondary">
              <span className="flex items-center gap-1"><Phone size={12} /> {customer.phone}</span>
              {customer.email && <span className="flex items-center gap-1"><Mail size={12} /> {customer.email}</span>}
            </div>
          </div>
        </div>

        {/* Wallet Balance */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs text-text-secondary mb-1">Wallet Balance</p>
            <p className="font-heading font-bold text-2xl text-primary">{formatCurrency(Number(customer.walletBalance))}</p>
          </div>
          <button
            onClick={() => setShowTopupModal(true)}
            className="btn-primary text-sm flex items-center gap-2"
          >
            <Plus size={14} /> Top Up
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Visits', value: customer.bills?.length || 0, icon: Receipt, color: 'text-blue-500' },
          { label: 'Lifetime Spend', value: formatCurrency(customer.bills?.reduce((s: number, b: any) => s + Number(b.netPayable), 0) || 0), icon: CreditCard, color: 'text-green-500' },
          { label: 'Loyalty Points', value: customer.loyaltyPoints || 0, icon: Award, color: 'text-yellow-500' },
          { label: 'Active Packages', value: (customer.activeSpaPacks?.length || 0) + (customer.activePrepaidPacks?.length || 0), icon: Package, color: 'text-purple-500' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card-glass p-4 text-center">
            <Icon size={20} className={`${color} mx-auto mb-2`} />
            <p className="font-heading font-bold text-lg text-text-primary">{value}</p>
            <p className="text-xs text-text-secondary">{label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="card-glass overflow-hidden">
        <div className="flex border-b border-border">
          {(['VISITS', 'WALLET', 'PACKAGES', 'MEMBERSHIP'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 text-xs font-semibold transition-colors ${
                activeTab === tab
                  ? 'bg-primary/10 text-primary border-b-2 border-primary'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {tab === 'VISITS' && <Receipt size={12} className="inline mr-1" />}
              {tab === 'WALLET' && <Wallet size={12} className="inline mr-1" />}
              {tab === 'PACKAGES' && <Package size={12} className="inline mr-1" />}
              {tab === 'MEMBERSHIP' && <Award size={12} className="inline mr-1" />}
              {tab}
            </button>
          ))}
        </div>

        <div className="p-4">
          {activeTab === 'VISITS' && (
            <div className="space-y-3">
              {customer.bills?.length === 0 && (
                <div className="text-center py-8 text-text-secondary">
                  <FileText size={32} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No visit history yet</p>
                </div>
              )}
              {(customer.bills || []).map((bill: any) => (
                <div key={bill.id} className="flex items-center justify-between p-3 rounded-lg bg-surface border border-border">
                  <div>
                    <p className="font-semibold text-sm text-text-primary">{bill.billNumber}</p>
                    <p className="text-xs text-text-secondary">{formatDateTime(bill.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm text-text-primary">{formatCurrency(Number(bill.netPayable))}</p>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      bill.paymentStatus === 'PAID' ? 'bg-green-100 text-green-700' :
                      bill.paymentStatus === 'PARTIAL' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {bill.paymentStatus}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'WALLET' && (
            <div className="space-y-3">
              {customer.walletTransactions?.length === 0 && (
                <div className="text-center py-8 text-text-secondary">
                  <Wallet size={32} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No wallet transactions yet</p>
                </div>
              )}
              {(customer.walletTransactions || []).map((txn: any) => (
                <div key={txn.id} className="flex items-center justify-between p-3 rounded-lg bg-surface border border-border">
                  <div>
                    <p className={`font-semibold text-sm ${txn.type === 'CREDIT' ? 'text-green-600' : 'text-red-600'}`}>
                      {txn.type === 'CREDIT' ? '+' : '-'}{formatCurrency(Number(txn.amount))}
                    </p>
                    <p className="text-xs text-text-secondary">{txn.reason}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-text-secondary">Balance: {formatCurrency(Number(txn.balance))}</p>
                    <p className="text-xs text-text-secondary">{formatDateTime(txn.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'PACKAGES' && (
            <div className="space-y-3">
              {(customer.activeSpaPacks?.length === 0 && customer.activePrepaidPacks?.length === 0) && (
                <div className="text-center py-8 text-text-secondary">
                  <Package size={32} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No active packages</p>
                </div>
              )}
              {(customer.activeSpaPacks || []).map((p: any) => (
                <div key={p.id} className="p-3 rounded-lg bg-surface border border-border">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-sm">{p.spaPack?.name}</p>
                      <p className="text-xs text-text-secondary">
                        {p.sessionsRemaining}/{p.sessionsTotal} sessions remaining
                      </p>
                    </div>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{p.status}</span>
                  </div>
                </div>
              ))}
              {(customer.activePrepaidPacks || []).map((p: any) => (
                <div key={p.id} className="p-3 rounded-lg bg-surface border border-border">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-sm">{p.prepaidPack?.name}</p>
                      <p className="text-xs text-text-secondary">
                        Balance: {formatCurrency(Number(p.balance))}
                      </p>
                    </div>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{p.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'MEMBERSHIP' && (
            <div className="space-y-3">
              {customer.memberships?.length === 0 && (
                <div className="text-center py-8 text-text-secondary">
                  <Award size={32} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No active membership</p>
                </div>
              )}
              {(customer.memberships || []).map((m: any) => (
                <div key={m.id} className="p-3 rounded-lg bg-surface border border-border">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-sm">{m.membershipPlan?.name}</p>
                      <p className="text-xs text-text-secondary">
                        Expires: {m.expiresAt ? formatDateTime(m.expiresAt) : 'N/A'}
                      </p>
                    </div>
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">{m.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Wallet Top-up Modal */}
      {showTopupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="font-heading font-bold text-lg mb-4 flex items-center gap-2">
              <Wallet size={20} className="text-primary" /> Wallet Top-up
            </h3>
            <p className="text-sm text-text-secondary mb-4">
              Adding to <strong>{customer.name}</strong>'s wallet
            </p>
            <div className="mb-4">
              <label className="form-label">Amount (₹)</label>
              <input
                type="number"
                min="1"
                value={walletAmount}
                onChange={(e) => setWalletAmount(Number(e.target.value))}
                className="input-field"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowTopupModal(false)}
                className="btn-outline flex-1"
                disabled={isTopupLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleTopupWallet}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
                disabled={isTopupLoading || walletAmount <= 0}
              >
                {isTopupLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Plus size={14} /> Add {formatCurrency(walletAmount)}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}