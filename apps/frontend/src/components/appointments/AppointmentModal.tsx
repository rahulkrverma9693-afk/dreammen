import { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  X, Calendar, Clock, User, Scissors, LayoutGrid, FileText,
  Search, Check, ChevronDown, AlertCircle, CheckCircle2,
  Phone, RefreshCw, XCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import { MOCK_CUSTOMERS, MOCK_SERVICES, MOCK_EMPLOYEES } from '../../utils/mockData';

// ─── Types ────────────────────────────────────────────────────
interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
  category?: { name: string };
}

interface Employee {
  id: string;
  name: string;
  role: string;
  photoUrl?: string;
}

interface Chair {
  id: string;
  name: string;
  type: string;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
  photoUrl?: string;
}

interface AppointmentService {
  id: string;
  service: Service;
  duration: number;
}

interface Appointment {
  id: string;
  status: string;
  source: string;
  startTime: string;
  endTime: string;
  notes?: string;
  cancelReason?: string;
  customer: Customer;
  employee?: Employee;
  chair?: Chair;
  services: AppointmentService[];
  bill?: { id: string; billNumber: string; paymentStatus: string };
}

interface AppointmentModalProps {
  appointment: Appointment | null;
  onClose: () => void;
  onSaved: () => void;
}

// ─── Status Meta ──────────────────────────────────────────────
const STATUS_META: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  SCHEDULED: { label: 'Scheduled', color: 'text-blue-600', icon: <Clock size={14} /> },
  CONFIRMED: { label: 'Confirmed', color: 'text-rose-600', icon: <CheckCircle2 size={14} /> },
  IN_PROGRESS: { label: 'In Progress', color: 'text-amber-600', icon: <RefreshCw size={14} /> },
  COMPLETED: { label: 'Completed', color: 'text-green-600', icon: <CheckCircle2 size={14} /> },
  CANCELLED: { label: 'Cancelled', color: 'text-red-600', icon: <XCircle size={14} /> },
  NO_SHOW: { label: 'No Show', color: 'text-gray-600', icon: <AlertCircle size={14} /> },
};

function toInputDateTime(iso?: string) {
  if (!iso) return '';
  return iso.substring(0, 16);
}

function computeEndTime(startStr: string, durationMinutes: number): string {
  const d = new Date(startStr);
  d.setMinutes(d.getMinutes() + durationMinutes);
  return d.toISOString().substring(0, 16);
}

// ─── Customer Search ──────────────────────────────────────────
function CustomerSearch({
  value, onChange,
}: { value: Customer | null; onChange: (c: Customer | null) => void }) {
  const [search, setSearch] = useState(value?.name || '');
  const [open, setOpen] = useState(false);

  const { data: results = null } = useQuery<Customer[]>({
    queryKey: ['customer-search', search],
    queryFn: async () => {
      try {
        const r = await api.get(`/customers?search=${encodeURIComponent(search)}&limit=10`);
        const list = r.data.data?.customers || (Array.isArray(r.data.data) ? r.data.data : []);
        return list;
      } catch (_) {
        const s = search.trim().toLowerCase();
        return MOCK_CUSTOMERS.filter(c =>
          !s || c.name.toLowerCase().includes(s) || c.phone.includes(s)
        );
      }
    },
    enabled: open && !value,
  });

  const displayCustomers = results ?? MOCK_CUSTOMERS.filter(c =>
    !search.trim() || c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search)
  );

  return (
    <div className="relative">
      {value ? (
        <div className="flex items-center gap-2 px-3 py-2.5 bg-rose-50 border border-primary-200 rounded-input">
          <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">
            {value.name.charAt(0)}
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold text-text-primary">{value.name}</div>
            <div className="text-xs text-text-secondary">{value.phone}</div>
          </div>
          <button onClick={() => { onChange(null); setSearch(''); }} className="text-text-secondary hover:text-red-600 p-1">
            <X size={16} />
          </button>
        </div>
      ) : (
        <div>
          <div className="flex items-center gap-2 px-3 py-2.5 bg-white border border-gray-200 rounded-input focus-within:border-primary focus-within:ring-1 focus-within:ring-primary-200">
            <Search size={16} className="text-gray-400" />
            <input
              type="text"
              placeholder="Search customer by name or phone…"
              value={search}
              onChange={e => { setSearch(e.target.value); setOpen(true); }}
              onFocus={() => setOpen(true)}
              className="flex-1 bg-transparent outline-none text-sm text-text-primary placeholder:text-gray-400"
            />
          </div>
          {open && displayCustomers.length > 0 && (
            <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-white border border-gray-200 rounded-input shadow-xl overflow-hidden max-h-48 overflow-y-auto">
              {displayCustomers.map(c => (
                <button
                  key={c.id}
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); onChange(c); setOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-rose-50 text-left transition-colors border-b border-gray-100 last:border-0"
                >
                  <div className="w-7 h-7 rounded-full bg-primary-100 text-primary flex items-center justify-center text-xs font-bold">
                    {c.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-text-primary">{c.name}</div>
                    <div className="text-xs text-text-secondary">{c.phone}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Service Multi-Select ─────────────────────────────────────
function ServiceMultiSelect({
  selected, onChange,
}: { selected: Service[]; onChange: (services: Service[]) => void }) {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);

  const { data: rawServices = [] } = useQuery<Service[]>({
    queryKey: ['services-list'],
    queryFn: async () => {
      try {
        const r = await api.get('/services');
        if (r.data.data && r.data.data.length > 0) return r.data.data;
      } catch (_) {}
      return MOCK_SERVICES as Service[];
    },
  });
  const allServices = rawServices.length > 0 ? rawServices : (MOCK_SERVICES as Service[]);

  const filtered = allServices.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) &&
    !selected.find(sel => sel.id === s.id)
  );

  const totalDuration = selected.reduce((sum, s) => sum + s.duration, 0);

  return (
    <div className="space-y-2">
      {/* Selected services */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map(s => (
            <div key={s.id}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 border border-primary-200 rounded-input text-xs text-primary font-medium">
              {s.name} · {s.duration}m
              <button onClick={() => onChange(selected.filter(x => x.id !== s.id))} className="hover:text-primary-900">
                <X size={12} />
              </button>
            </div>
          ))}
          <div className="text-xs text-text-secondary self-center ml-1 font-medium">
            Total: {totalDuration}m
          </div>
        </div>
      )}

      {/* Search and dropdown */}
      <div className="relative">
        <div className="flex items-center gap-2 px-3 py-2.5 bg-white border border-gray-200 rounded-input focus-within:border-primary focus-within:ring-1 focus-within:ring-primary-200">
          <Search size={16} className="text-gray-400" />
          <input
            type="text"
            placeholder="Add service…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 200)}
            className="flex-1 bg-transparent outline-none text-sm text-text-primary placeholder:text-gray-400"
          />
          <ChevronDown size={16} className="text-gray-400" />
        </div>
        {open && filtered.length > 0 && (
          <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-white border border-gray-200 rounded-input shadow-xl overflow-hidden max-h-48 overflow-y-auto">
            {filtered.map(s => (
              <button
                key={s.id}
                type="button"
                onMouseDown={() => onChange([...selected, s])}
                className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-rose-50 text-left transition-colors border-b border-gray-100 last:border-0"
              >
                <span className="text-sm font-medium text-text-primary">{s.name}</span>
                <span className="text-xs text-text-secondary">{s.duration}m · ₹{Number(s.price).toFixed(0)}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Modal ───────────────────────────────────────────────
export default function AppointmentModal({ appointment, onClose, onSaved }: AppointmentModalProps) {
  const isEdit = !!appointment;

  // Form state
  const [customer, setCustomer] = useState<Customer | null>(appointment?.customer || null);
  const [selectedServices, setSelectedServices] = useState<Service[]>(
    appointment?.services.map(s => s.service) || []
  );
  const [employeeId, setEmployeeId] = useState(appointment?.employee?.id || '');
  const [chairId, setChairId] = useState(appointment?.chair?.id || '');
  const [source, setSource] = useState(appointment?.source || 'WALK_IN');
  const [notes, setNotes] = useState(appointment?.notes || '');
  const [startTime, setStartTime] = useState(
    toInputDateTime(appointment?.startTime) || (() => {
      const d = new Date();
      d.setMinutes(Math.ceil(d.getMinutes() / 15) * 15, 0, 0);
      return d.toISOString().substring(0, 16);
    })()
  );

  // Auto-compute end time based on services
  const totalDuration = selectedServices.reduce((sum, s) => sum + s.duration, 0) || 60;
  const [endTime, setEndTime] = useState(
    toInputDateTime(appointment?.endTime) || computeEndTime(startTime, 60)
  );

  // Update end time when services or start time change
  useEffect(() => {
    if (totalDuration > 0) {
      setEndTime(computeEndTime(startTime, totalDuration));
    }
  }, [selectedServices, startTime]);

  // Fetch employees & chairs
  const { data: rawEmployees = [] } = useQuery<Employee[]>({
    queryKey: ['employees'],
    queryFn: async () => {
      try {
        const r = await api.get('/employees');
        if (r.data.data && r.data.data.length > 0) return r.data.data;
      } catch (_) {}
      return MOCK_EMPLOYEES as Employee[];
    },
  });
  const employees = rawEmployees.length > 0 ? rawEmployees : (MOCK_EMPLOYEES as Employee[]);

  const DEFAULT_CHAIRS: Chair[] = [
    { id: 'chair-1', name: 'Styling Station 1', type: 'CHAIR' },
    { id: 'chair-2', name: 'Styling Station 2', type: 'CHAIR' },
    { id: 'chair-3', name: 'Spa Room A', type: 'ROOM' },
  ];

  const { data: rawChairs = [] } = useQuery<Chair[]>({
    queryKey: ['chairs'],
    queryFn: async () => {
      try {
        const r = await api.get('/appointments/chairs');
        if (r.data.data && r.data.data.length > 0) return r.data.data;
      } catch (_) {}
      return DEFAULT_CHAIRS;
    },
  });
  const chairs = rawChairs.length > 0 ? rawChairs : DEFAULT_CHAIRS;

  // Status mutation (edit mode)
  const statusMutation = useMutation({
    mutationFn: (status: string) =>
      api.patch(`/appointments/${appointment!.id}/status`, { status }),
    onSuccess: (_, status) => {
      toast.success(`Marked as ${STATUS_META[status]?.label || status}`);
      onSaved();
    },
    onError: () => toast.error('Failed to update status'),
  });

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: (data: any) => isEdit
      ? api.patch(`/appointments/${appointment!.id}`, data)
      : api.post('/appointments', data),
    onSuccess: () => {
      toast.success(isEdit ? 'Appointment updated' : 'Appointment booked');
      onSaved();
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'Failed to save appointment';
      toast.error(msg);
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!customer) { toast.error('Please select a customer'); return; }
    if (!startTime || !endTime) { toast.error('Start and end time are required'); return; }

    saveMutation.mutate({
      customerId: customer.id,
      employeeId: employeeId || null,
      chairId: chairId || null,
      startTime: new Date(startTime).toISOString(),
      endTime: new Date(endTime).toISOString(),
      notes,
      source,
      serviceIds: selectedServices.map(s => s.id),
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-up">
      {/* Modal Container — SOLID WHITE BACKGROUND */}
      <div className="bg-white rounded-card shadow-2xl border border-primary-100 max-w-xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-rose-gradient text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar size={20} />
            <div>
              <h3 className="font-heading font-bold text-lg leading-snug text-white">
                {isEdit ? 'Edit Appointment' : 'Book New Appointment'}
              </h3>
              {isEdit && (
                <div className="text-xs text-rose-100 font-medium">
                  Current Status: {STATUS_META[appointment!.status]?.label}
                </div>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-white/20 text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1 bg-white">
          {/* Customer */}
          <div>
            <label className="block text-xs font-bold text-text-primary mb-1 uppercase tracking-wide flex items-center gap-1">
              <User size={13} className="text-primary" /> Customer *
            </label>
            <CustomerSearch value={customer} onChange={setCustomer} />
          </div>

          {/* Services */}
          <div>
            <label className="block text-xs font-bold text-text-primary mb-1 uppercase tracking-wide flex items-center gap-1">
              <Scissors size={13} className="text-primary" /> Services
            </label>
            <ServiceMultiSelect selected={selectedServices} onChange={setSelectedServices} />
          </div>

          {/* Start & End time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-text-primary mb-1 uppercase tracking-wide flex items-center gap-1">
                <Clock size={13} className="text-primary" /> Start Time *
              </label>
              <input
                type="datetime-local"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                required
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-primary mb-1 uppercase tracking-wide">
                End Time *
              </label>
              <input
                type="datetime-local"
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
                required
                className="input-field"
              />
            </div>
          </div>

          {/* Employee & Chair */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-text-primary mb-1 uppercase tracking-wide flex items-center gap-1">
                <Scissors size={13} className="text-primary" /> Stylist
              </label>
              <select
                value={employeeId}
                onChange={e => setEmployeeId(e.target.value)}
                className="input-field"
              >
                <option value="">Any Available Stylist</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-text-primary mb-1 uppercase tracking-wide flex items-center gap-1">
                <LayoutGrid size={13} className="text-primary" /> Chair / Room
              </label>
              <select
                value={chairId}
                onChange={e => setChairId(e.target.value)}
                className="input-field"
              >
                <option value="">No Preference</option>
                {chairs.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.type})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Source & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-text-primary mb-1 uppercase tracking-wide">
                Booking Source
              </label>
              <select
                value={source}
                onChange={e => setSource(e.target.value)}
                className="input-field"
              >
                <option value="WALK_IN">Walk-in</option>
                <option value="PHONE">Phone Call</option>
                <option value="WHATSAPP">WhatsApp</option>
                <option value="ONLINE">Online Booking</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-text-primary mb-1 uppercase tracking-wide flex items-center gap-1">
                <FileText size={13} className="text-primary" /> Notes / Requests
              </label>
              <input
                type="text"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Optional client preferences…"
                className="input-field"
              />
            </div>
          </div>

          {/* Status transitions (edit mode) */}
          {isEdit && appointment && (
            <div className="p-3 bg-rose-50 rounded-card border border-primary-100">
              <p className="text-xs font-bold text-primary mb-2 uppercase tracking-wide">Quick Status Transition</p>
              <div className="flex flex-wrap gap-2">
                {['CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW']
                  .filter(s => s !== appointment.status)
                  .map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => statusMutation.mutate(s)}
                      disabled={statusMutation.isPending}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-button border bg-white border-gray-200 text-text-primary hover:border-primary hover:text-primary transition-all font-medium"
                    >
                      {STATUS_META[s]?.icon}
                      {STATUS_META[s]?.label}
                    </button>
                  ))}
              </div>
            </div>
          )}

          {/* Bill info (edit mode) */}
          {isEdit && appointment?.bill && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-card text-xs text-green-800 font-semibold">
              <CheckCircle2 size={16} className="text-green-600" />
              Bill #{appointment.bill.billNumber} — {appointment.bill.paymentStatus}
            </div>
          )}

          {/* Footer actions */}
          <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-button border border-gray-300 text-sm font-semibold text-text-secondary hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="flex-1 btn-primary flex items-center justify-center gap-2"
            >
              {saveMutation.isPending ? (
                <><RefreshCw size={16} className="animate-spin" /> Saving…</>
              ) : (
                <><Check size={16} />{isEdit ? 'Update Appointment' : 'Confirm Booking'}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
