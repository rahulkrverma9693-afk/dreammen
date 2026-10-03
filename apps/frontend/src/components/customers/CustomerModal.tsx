import { useState, useEffect } from 'react';
import { X, UserPlus, Phone, User, Mail, Calendar, MapPin, FileText, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { useQuery } from '@tanstack/react-query';
import api from '../../utils/api';

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (customer: any) => void;
  initialPhone?: string;
  initialName?: string;
  customer?: any;
}

export default function CustomerModal({
  isOpen,
  onClose,
  onSuccess,
  initialPhone = '',
  initialName = '',
  customer,
}: CustomerModalProps) {
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState<'FEMALE' | 'MALE' | 'OTHER'>('FEMALE');
  const [dob, setDob] = useState('');
  const [anniversary, setAnniversary] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Mumbai');
  const [notes, setNotes] = useState('');
  const [groupId, setGroupId] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (customer) {
      setName(customer.name || '');
      setPhone(customer.phone || '');
      setEmail(customer.email || '');
      setGender(customer.gender || 'FEMALE');
      setDob(customer.dob ? new Date(customer.dob).toISOString().slice(0, 10) : '');
      setAnniversary(customer.anniversary ? new Date(customer.anniversary).toISOString().slice(0, 10) : '');
      setAddress(customer.address || '');
      setCity(customer.city || 'Mumbai');
      setNotes(customer.notes || '');
      setGroupId(customer.groupId || '');
    } else {
      setName(initialName);
      setPhone(initialPhone);
    }
  }, [customer, initialName, initialPhone, isOpen]);

  // Fetch real customer groups from backend
  const { data: customerGroups = [] } = useQuery<{ id: string; name: string; color: string }[]>({
    queryKey: ['customer-groups'],
    queryFn: async () => {
      try {
        const r = await api.get('/settings');
        return r.data.data?.customerGroups || [];
      } catch { return []; }
    },
    enabled: isOpen,
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) {
      toast.error('Customer Name and Phone number are required!');
      return;
    }
    if (phone.length < 10) {
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        name,
        phone,
        email: email || undefined,
        gender,
        dob: dob || undefined,
        anniversary: anniversary || undefined,
        address: address || undefined,
        city: city || undefined,
        notes: notes || undefined,
        groupId: groupId || undefined,
      };

      let resCust;
      if (customer?.id) {
        const res = await api.put(`/customers/${customer.id}`, payload);
        resCust = res.data.data || { ...customer, ...payload };
        toast.success(`Customer ${name} updated successfully! 🌹`);
      } else {
        const res = await api.post('/customers', payload);
        resCust = res.data.data;
        toast.success(`Customer ${name} added successfully! 🌹`);
      }

      onSuccess(resCust);
      onClose();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || (customer ? 'Failed to update customer' : 'Failed to add customer');
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-up">
      <div className="bg-white rounded-card shadow-2xl border border-primary-100 max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-rose-gradient text-white p-4 flex items-center justify-between">
          <h3 className="font-heading font-bold text-lg flex items-center gap-2">
            <UserPlus size={20} /> Create New Customer Profile
          </h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-white/20 text-white">
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label flex items-center gap-1">
                <User size={14} /> Full Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Priya Sharma"
                className="input-field"
                required
                autoFocus
              />
            </div>
            <div>
              <label className="form-label flex items-center gap-1">
                <Phone size={14} /> Phone Number *
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="10-digit mobile number"
                className="input-field"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label flex items-center gap-1">
                <Mail size={14} /> Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="customer@gmail.com"
                className="input-field"
              />
            </div>
            <div>
              <label className="form-label">Gender</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'FEMALE', label: 'Female' },
                  { id: 'MALE',   label: 'Male' },
                  { id: 'OTHER',  label: 'Other' },
                ].map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setGender(g.id as any)}
                    className={`py-2 text-xs rounded-input border font-medium transition-all ${
                      gender === g.id
                        ? 'border-primary bg-rose-panel text-primary font-bold shadow-xs'
                        : 'border-gray-200 text-text-secondary hover:border-gray-300'
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label flex items-center gap-1">
                <Calendar size={14} /> Date of Birth
              </label>
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="input-field text-xs"
              />
            </div>
            <div>
              <label className="form-label flex items-center gap-1">
                <Calendar size={14} /> Anniversary
              </label>
              <input
                type="date"
                value={anniversary}
                onChange={(e) => setAnniversary(e.target.value)}
                className="input-field text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label flex items-center gap-1">
                <MapPin size={14} /> City
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="form-label">Customer Group</label>
              <select
                value={groupId}
                onChange={(e) => setGroupId(e.target.value)}
                className="select-field text-xs"
              >
                <option value="">-- Select Group --</option>
                {customerGroups.length > 0
                  ? customerGroups.map((g) => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))
                  : (
                    <>
                      <option value="grp-1">VIP Ladies</option>
                      <option value="grp-2">Regular Men</option>
                      <option value="grp-3">Corporate Client</option>
                    </>
                  )
                }
              </select>
            </div>
          </div>

          <div>
            <label className="form-label flex items-center gap-1">
              <FileText size={14} /> Allergies / Preferences / Private Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Ammonia-free dye preferred, scalp sensitivity"
              className="input-field text-xs"
            />
          </div>

          {/* Footer Buttons */}
          <div className="border-t border-gray-100 pt-4 flex items-center justify-end gap-2">
            <button type="button" onClick={onClose} className="btn-ghost text-xs" disabled={isSaving}>
              Cancel
            </button>
            <button type="submit" className="btn-primary text-xs py-2 px-4 flex items-center gap-2" disabled={isSaving}>
              {isSaving && <RefreshCw size={14} className="animate-spin" />}
              {isSaving ? 'Saving...' : 'Save Customer & Select'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
