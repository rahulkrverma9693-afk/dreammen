import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users, Store, Sliders, CreditCard, Printer, Shield, Save, RefreshCw,
  Copy, ExternalLink, Check, X, Clock, Globe, Key, Lock, FileText, CheckCircle2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import StaffPage from './StaffPage';

// ─── Default Business Hours ───────────────────────────────────
const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'staff' | 'salon' | 'billing' | 'integrations' | 'roles'>('staff');

  // Form states
  const [branchForm, setBranchForm] = useState({
    name: 'DreamGirl Family Salon — Main Branch',
    phone: '+91 98765 43210',
    email: 'contact@dreamgirlsalon.com',
    address: '123 Rose Garden Road, Model Town',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400001',
    googleMapLink: 'https://maps.google.com/?q=DreamGirlSalon',
    bookingEnabled: true,
    slotDuration: 30,
  });

  const [settingsForm, setSettingsForm] = useState({
    bill_prefix: 'DG-2026-',
    next_bill_number: '1001',
    currency: 'INR',
    gstin: '07AAAAA0000A1Z5',
    gst_enabled: 'true',
    price_inclusive_tax: 'false',
    printer_paper_width: '80mm',
    printer_header: 'DREAMGIRL FAMILY SALON & SPA',
    printer_footer: 'Thank you for visiting! Follow us @dreamgirlsalon',
    razorpay_key_id: 'rzp_live_x892aKls81',
    razorpay_key_secret: '••••••••••••••••',
    razorpay_mode: 'live',
    msg91_key: '••••••••••••••••',
    whatsapp_api_key: '••••••••••••••••',
  });

  // Fetch Settings & Branch profile
  const { data: settingsData, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const r = await api.get('/settings');
      return r.data.data;
    },
  });

  useEffect(() => {
    if (settingsData) {
      if (settingsData.branch) {
        setBranchForm(f => ({
          ...f,
          name: settingsData.branch.name || f.name,
          phone: settingsData.branch.phone || f.phone,
          email: settingsData.branch.email || f.email,
          address: settingsData.branch.address || f.address,
          city: settingsData.branch.city || f.city,
          state: settingsData.branch.state || f.state,
          pincode: settingsData.branch.pincode || f.pincode,
          googleMapLink: settingsData.branch.googleMapLink || f.googleMapLink,
          bookingEnabled: settingsData.branch.bookingEnabled ?? f.bookingEnabled,
          slotDuration: settingsData.branch.slotDuration || f.slotDuration,
        }));
      }
      if (settingsData.settings) {
        setSettingsForm(s => ({ ...s, ...settingsData.settings }));
      }
    }
  }, [settingsData]);

  // Mutations
  const saveBranchMutation = useMutation({
    mutationFn: (data: any) => api.patch('/settings/branch', data),
    onSuccess: () => {
      toast.success('Salon profile & booking hours updated');
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
    onError: () => toast.error('Failed to update salon profile'),
  });

  const saveSettingsMutation = useMutation({
    mutationFn: (settings: any) => api.put('/settings', { settings }),
    onSuccess: () => {
      toast.success('Billing & printer preferences saved');
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
    onError: () => toast.error('Failed to save settings'),
  });

  function handleCopyBookingLink() {
    navigator.clipboard.writeText('http://localhost:5173/book');
    toast.success('Online booking link copied to clipboard! 📋');
  }

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading font-bold text-2xl text-text-primary">Settings & System Config</h1>
          <p className="text-text-secondary text-sm mt-0.5">
            Staff management, branch profile, billing rules, GST tax slabs, thermal printer, & payment gateways
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-rose-panel rounded-button p-1 gap-1 w-fit">
        {([
          ['staff', 'Staff Management', Users],
          ['salon', 'Salon & BookingZone', Store],
          ['billing', 'Billing, GST & Printer', Sliders],
          ['integrations', 'Payment & SMS API', CreditCard],
          ['roles', 'Role Access Matrix', Shield],
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

      {/* ── TAB 1: Staff Management ── */}
      {activeTab === 'staff' && <StaffPage />}

      {/* ── TAB 2: Salon & BookingZone ── */}
      {activeTab === 'salon' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Salon Details Form */}
          <div className="lg:col-span-2 bg-white rounded-card shadow-card border border-primary-100/40 p-6 space-y-4">
            <h3 className="font-heading font-bold text-base text-text-primary">Salon Branch Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-bold text-text-primary mb-1 uppercase tracking-wide">Branch Name *</label>
                <input type="text" value={branchForm.name} onChange={e => setBranchForm(f => ({ ...f, name: e.target.value }))} className="input-field" />
              </div>
              <div>
                <label className="block text-xs font-bold text-text-primary mb-1 uppercase tracking-wide">Phone Number</label>
                <input type="text" value={branchForm.phone} onChange={e => setBranchForm(f => ({ ...f, phone: e.target.value }))} className="input-field" />
              </div>
              <div>
                <label className="block text-xs font-bold text-text-primary mb-1 uppercase tracking-wide">Contact Email</label>
                <input type="email" value={branchForm.email} onChange={e => setBranchForm(f => ({ ...f, email: e.target.value }))} className="input-field" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-bold text-text-primary mb-1 uppercase tracking-wide">Street Address</label>
                <textarea value={branchForm.address} onChange={e => setBranchForm(f => ({ ...f, address: e.target.value }))} className="input-field h-20 resize-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-text-primary mb-1 uppercase tracking-wide">City</label>
                <input type="text" value={branchForm.city} onChange={e => setBranchForm(f => ({ ...f, city: e.target.value }))} className="input-field" />
              </div>
              <div>
                <label className="block text-xs font-bold text-text-primary mb-1 uppercase tracking-wide">Pincode</label>
                <input type="text" value={branchForm.pincode} onChange={e => setBranchForm(f => ({ ...f, pincode: e.target.value }))} className="input-field" />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => saveBranchMutation.mutate(branchForm)}
                disabled={saveBranchMutation.isPending}
                className="btn-primary flex items-center gap-2 text-xs"
              >
                {saveBranchMutation.isPending ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />} Save Salon Info
              </button>
            </div>
          </div>

          {/* BookingZone Online Booking Config */}
          <div className="lg:col-span-1 bg-white rounded-card shadow-card border border-primary-100/40 p-6 space-y-4">
            <h3 className="font-heading font-bold text-base text-text-primary flex items-center gap-2">
              <Globe className="text-primary" size={18} /> BookingZone Online Booking
            </h3>

            <div className="p-3 bg-rose-50 rounded-card border border-primary-100 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-primary">
                <span>Public Booking Portal</span>
                <span className="text-green-700">● Live</span>
              </div>
              <p className="text-[11px] text-text-secondary">Clients can book appointments 24/7 via your unique salon link.</p>
              <button
                onClick={handleCopyBookingLink}
                className="w-full py-1.5 bg-white border border-primary-200 text-primary rounded-button text-xs font-bold hover:bg-primary hover:text-white transition-all flex items-center justify-center gap-1.5"
              >
                <Copy size={13} /> Copy Booking Link
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-text-primary mb-1 uppercase tracking-wide">Slot Duration (Minutes)</label>
              <select
                value={branchForm.slotDuration}
                onChange={e => setBranchForm(f => ({ ...f, slotDuration: parseInt(e.target.value) }))}
                className="input-field"
              >
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes (Standard)</option>
                <option value={45}>45 minutes</option>
                <option value={60}>60 minutes</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: Billing, GST & Printer ── */}
      {activeTab === 'billing' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Invoice & GST Config */}
          <div className="bg-white rounded-card shadow-card border border-primary-100/40 p-6 space-y-4">
            <h3 className="font-heading font-bold text-base text-text-primary flex items-center gap-2">
              <Sliders className="text-primary" size={18} /> Billing & GST Configuration
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-text-primary mb-1 uppercase tracking-wide">Bill Prefix</label>
                <input type="text" value={settingsForm.bill_prefix} onChange={e => setSettingsForm(s => ({ ...s, bill_prefix: e.target.value }))} className="input-field font-mono" />
              </div>
              <div>
                <label className="block text-xs font-bold text-text-primary mb-1 uppercase tracking-wide">Next Bill Number</label>
                <input type="number" value={settingsForm.next_bill_number} onChange={e => setSettingsForm(s => ({ ...s, next_bill_number: e.target.value }))} className="input-field font-mono" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-bold text-text-primary mb-1 uppercase tracking-wide">Salon GSTIN Number</label>
                <input type="text" value={settingsForm.gstin} onChange={e => setSettingsForm(s => ({ ...s, gstin: e.target.value }))} className="input-field font-mono uppercase" />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => saveSettingsMutation.mutate(settingsForm)}
                disabled={saveSettingsMutation.isPending}
                className="btn-primary flex items-center gap-2 text-xs"
              >
                {saveSettingsMutation.isPending ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />} Save Billing Config
              </button>
            </div>
          </div>

          {/* Thermal Printer Settings */}
          <div className="bg-white rounded-card shadow-card border border-primary-100/40 p-6 space-y-4">
            <h3 className="font-heading font-bold text-base text-text-primary flex items-center gap-2">
              <Printer className="text-primary" size={18} /> 80mm ESC/POS Thermal Receipt Printer
            </h3>

            <div>
              <label className="block text-xs font-bold text-text-primary mb-1 uppercase tracking-wide">Printer Paper Width</label>
              <select value={settingsForm.printer_paper_width} onChange={e => setSettingsForm(s => ({ ...s, printer_paper_width: e.target.value }))} className="input-field">
                <option value="80mm">80mm Thermal Paper (Standard POS)</option>
                <option value="58mm">58mm Thermal Paper (Compact POS)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-text-primary mb-1 uppercase tracking-wide">Receipt Header Title</label>
              <input type="text" value={settingsForm.printer_header} onChange={e => setSettingsForm(s => ({ ...s, printer_header: e.target.value }))} className="input-field font-mono" />
            </div>

            <div>
              <label className="block text-xs font-bold text-text-primary mb-1 uppercase tracking-wide">Receipt Footer Note</label>
              <input type="text" value={settingsForm.printer_footer} onChange={e => setSettingsForm(s => ({ ...s, printer_footer: e.target.value }))} className="input-field font-mono" />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => saveSettingsMutation.mutate(settingsForm)}
                disabled={saveSettingsMutation.isPending}
                className="btn-primary flex items-center gap-2 text-xs"
              >
                {saveSettingsMutation.isPending ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />} Save Printer Config
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: Payment & SMS API ── */}
      {activeTab === 'integrations' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Razorpay Setup */}
          <div className="bg-white rounded-card shadow-card border border-primary-100/40 p-6 space-y-4">
            <h3 className="font-heading font-bold text-base text-text-primary flex items-center gap-2">
              <CreditCard className="text-primary" size={18} /> Razorpay UPI & Card Gateway
            </h3>

            <div>
              <label className="block text-xs font-bold text-text-primary mb-1 uppercase tracking-wide">Razorpay Key ID</label>
              <input type="text" value={settingsForm.razorpay_key_id} onChange={e => setSettingsForm(s => ({ ...s, razorpay_key_id: e.target.value }))} className="input-field font-mono text-xs" />
            </div>

            <div>
              <label className="block text-xs font-bold text-text-primary mb-1 uppercase tracking-wide">Razorpay Key Secret</label>
              <input type="password" value={settingsForm.razorpay_key_secret} onChange={e => setSettingsForm(s => ({ ...s, razorpay_key_secret: e.target.value }))} className="input-field font-mono text-xs" />
            </div>

            <div className="flex items-center gap-2 text-xs text-green-700 font-semibold bg-green-50 p-2.5 rounded-card border border-green-200">
              <CheckCircle2 size={16} /> Dynamic UPI QR generation & Auto-verification active
            </div>
          </div>

          {/* WhatsApp & SMS API Setup */}
          <div className="bg-white rounded-card shadow-card border border-primary-100/40 p-6 space-y-4">
            <h3 className="font-heading font-bold text-base text-text-primary flex items-center gap-2">
              <Key className="text-primary" size={18} /> WhatsApp & SMS Gateway Keys
            </h3>

            <div>
              <label className="block text-xs font-bold text-text-primary mb-1 uppercase tracking-wide">MSG91 Transactional SMS API Key</label>
              <input type="password" value={settingsForm.msg91_key} onChange={e => setSettingsForm(s => ({ ...s, msg91_key: e.target.value }))} className="input-field font-mono text-xs" />
            </div>

            <div>
              <label className="block text-xs font-bold text-text-primary mb-1 uppercase tracking-wide">WhatsApp Business API Key</label>
              <input type="password" value={settingsForm.whatsapp_api_key} onChange={e => setSettingsForm(s => ({ ...s, whatsapp_api_key: e.target.value }))} className="input-field font-mono text-xs" />
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 5: Role Matrix ── */}
      {activeTab === 'roles' && (
        <div className="bg-white rounded-card shadow-card border border-primary-100/40 p-6 space-y-4">
          <h3 className="font-heading font-bold text-base text-text-primary flex items-center gap-2">
            <Shield className="text-primary" size={18} /> Role Access Control Matrix (RBAC)
          </h3>
          <p className="text-xs text-text-secondary">Granular security permissions per staff role across all 9 modules.</p>

          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-rose-panel border-b border-gray-200 text-xs font-bold text-text-secondary uppercase">
                <th className="px-4 py-3">Permission Area</th>
                <th className="px-4 py-3 text-center">Owner</th>
                <th className="px-4 py-3 text-center">Manager</th>
                <th className="px-4 py-3 text-center">Receptionist</th>
                <th className="px-4 py-3 text-center">Stylist</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs font-medium">
              {[
                { name: 'Dashboard — All Metrics', owner: true, manager: true, recep: true, stylist: false },
                { name: 'Billing — Create & Collect Payment', owner: true, manager: true, recep: true, stylist: false },
                { name: 'Billing — Delete / Refund Bill', owner: true, manager: true, recep: false, stylist: false },
                { name: 'Appointments — Manage Schedule', owner: true, manager: true, recep: true, stylist: true },
                { name: 'Customers — Full Directory Access', owner: true, manager: true, recep: true, stylist: false },
                { name: 'Inventory & Stock Adjustments', owner: true, manager: true, recep: true, stylist: false },
                { name: 'Reports — Full Financial Analytics', owner: true, manager: true, recep: false, stylist: false },
                { name: 'Marketing — WhatsApp Campaigns', owner: true, manager: true, recep: false, stylist: false },
                { name: 'Settings — System & API Keys', owner: true, manager: false, recep: false, stylist: false },
              ].map((r, i) => (
                <tr key={i} className="hover:bg-rose-50/40">
                  <td className="px-4 py-3 font-semibold text-text-primary">{r.name}</td>
                  <td className="px-4 py-3 text-center">{r.owner ? <Check className="inline text-green-600 font-bold" size={16} /> : <X className="inline text-gray-300" size={16} />}</td>
                  <td className="px-4 py-3 text-center">{r.manager ? <Check className="inline text-green-600 font-bold" size={16} /> : <X className="inline text-gray-300" size={16} />}</td>
                  <td className="px-4 py-3 text-center">{r.recep ? <Check className="inline text-green-600 font-bold" size={16} /> : <X className="inline text-gray-300" size={16} />}</td>
                  <td className="px-4 py-3 text-center">{r.stylist ? <Check className="inline text-green-600 font-bold" size={16} /> : <X className="inline text-gray-300" size={16} />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}