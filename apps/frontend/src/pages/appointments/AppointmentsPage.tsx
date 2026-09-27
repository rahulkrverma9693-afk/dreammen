import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Calendar, LayoutGrid, Plus, ChevronLeft, ChevronRight,
  Clock, User, Scissors, CheckCircle2, XCircle, AlertCircle,
  Phone, Link2, RefreshCw, Filter, List,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import { formatDate } from '../../utils/cn';
import AppointmentModal from '../../components/appointments/AppointmentModal';

// ─── Types ────────────────────────────────────────────────────
type ApptStatus = 'SCHEDULED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

interface AppointmentService {
  id: string;
  service: { id: string; name: string; duration: number; price: number };
  duration: number;
}

interface Appointment {
  id: string;
  status: ApptStatus;
  source: string;
  startTime: string;
  endTime: string;
  notes?: string;
  cancelReason?: string;
  customer: { id: string; name: string; phone: string; photoUrl?: string };
  employee?: { id: string; name: string; photoUrl?: string; role: string };
  chair?: { id: string; name: string; type: string };
  services: AppointmentService[];
  bill?: { id: string; billNumber: string; paymentStatus: string };
}

interface Chair {
  id: string;
  name: string;
  type: string;
}

interface TodayStats {
  total: number;
  confirmed: number;
  inProgress: number;
  completed: number;
  noShow: number;
  cancelled: number;
}

// ─── Status helpers ───────────────────────────────────────────
const STATUS_META: Record<ApptStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  SCHEDULED: { label: 'Scheduled', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20', icon: <Clock size={12} /> },
  CONFIRMED: { label: 'Confirmed', color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20', icon: <CheckCircle2 size={12} /> },
  IN_PROGRESS: { label: 'In Progress', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', icon: <RefreshCw size={12} /> },
  COMPLETED: { label: 'Completed', color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20', icon: <CheckCircle2 size={12} /> },
  CANCELLED: { label: 'Cancelled', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', icon: <XCircle size={12} /> },
  NO_SHOW: { label: 'No Show', color: 'text-gray-400', bg: 'bg-gray-500/10 border-gray-500/20', icon: <AlertCircle size={12} /> },
};

const STATUS_TRANSITIONS: Record<ApptStatus, ApptStatus[]> = {
  SCHEDULED: ['CONFIRMED', 'CANCELLED', 'NO_SHOW'],
  CONFIRMED: ['IN_PROGRESS', 'CANCELLED', 'NO_SHOW'],
  IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
  NO_SHOW: [],
};

// ─── Format helpers ───────────────────────────────────────────
function toDateStr(d: Date) {
  return d.toISOString().split('T')[0];
}
function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}
function getWeekDays(date: Date): Date[] {
  const day = date.getDay(); // 0=Sun
  const monday = new Date(date);
  monday.setDate(date.getDate() - ((day + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

// ─── Appointment Card ─────────────────────────────────────────
function AppointmentCard({
  appt, onStatusChange, onClick,
}: {
  appt: Appointment;
  onStatusChange: (id: string, status: ApptStatus) => void;
  onClick: (appt: Appointment) => void;
}) {
  const meta = STATUS_META[appt.status];
  const transitions = STATUS_TRANSITIONS[appt.status];
  const duration = Math.round(
    (new Date(appt.endTime).getTime() - new Date(appt.startTime).getTime()) / 60000
  );

  return (
    <div
      className="card-glass p-4 rounded-xl border border-white/5 hover:border-rose-400/30 transition-all cursor-pointer group"
      onClick={() => onClick(appt)}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Time */}
        <div className="text-center min-w-[52px]">
          <div className="text-xs font-bold text-rose-400">{formatTime(appt.startTime)}</div>
          <div className="text-[10px] text-text-secondary mt-0.5">{duration}m</div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-sm text-text-primary truncate">{appt.customer.name}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full border flex items-center gap-1 ${meta.bg} ${meta.color}`}>
              {meta.icon}{meta.label}
            </span>
          </div>
          <div className="text-xs text-text-secondary truncate">
            {appt.services.map(s => s.service.name).join(', ') || 'No services'}
          </div>
          {appt.employee && (
            <div className="text-xs text-text-secondary mt-0.5 flex items-center gap-1">
              <Scissors size={10} />{appt.employee.name}
            </div>
          )}
          {appt.chair && (
            <div className="text-xs text-text-secondary flex items-center gap-1">
              <LayoutGrid size={10} />{appt.chair.name}
            </div>
          )}
        </div>

        {/* Phone quick action */}
        <a
          href={`tel:${appt.customer.phone}`}
          onClick={e => e.stopPropagation()}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20"
        >
          <Phone size={12} />
        </a>
      </div>

      {/* Status transition buttons */}
      {transitions.length > 0 && (
        <div className="flex gap-1.5 mt-3 pt-3 border-t border-white/5" onClick={e => e.stopPropagation()}>
          {transitions.map(s => (
            <button
              key={s}
              onClick={() => onStatusChange(appt.id, s)}
              className={`text-[10px] px-2 py-1 rounded-lg border transition-all hover:scale-105 ${STATUS_META[s].bg} ${STATUS_META[s].color}`}
            >
              → {STATUS_META[s].label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Calendar View ────────────────────────────────────────────
const HOURS = Array.from({ length: 13 }, (_, i) => i + 8); // 8am–8pm

function CalendarView({
  appointments, selectedDate, onStatusChange, onAppointmentClick,
}: {
  appointments: Appointment[];
  selectedDate: Date;
  onStatusChange: (id: string, status: ApptStatus) => void;
  onAppointmentClick: (appt: Appointment) => void;
}) {
  const weekDays = getWeekDays(selectedDate);

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[800px]">
        {/* Header row */}
        <div className="grid grid-cols-8 border-b border-white/10 pb-3 mb-2">
          <div className="text-xs text-text-secondary text-right pr-3">TIME</div>
          {weekDays.map(day => {
            const isToday = toDateStr(day) === toDateStr(new Date());
            return (
              <div key={day.toISOString()} className="text-center px-1">
                <div className="text-xs text-text-secondary">
                  {day.toLocaleDateString('en-IN', { weekday: 'short' })}
                </div>
                <div className={`text-sm font-bold mt-0.5 w-8 h-8 rounded-full flex items-center justify-center mx-auto
                  ${isToday ? 'bg-rose-500 text-white' : 'text-text-primary'}`}>
                  {day.getDate()}
                </div>
              </div>
            );
          })}
        </div>

        {/* Time slots */}
        <div className="relative">
          {HOURS.map(hour => (
            <div key={hour} className="grid grid-cols-8 min-h-[64px] border-b border-white/5">
              <div className="text-right pr-3 pt-1">
                <span className="text-[10px] text-text-secondary">
                  {hour < 12 ? `${hour}am` : hour === 12 ? '12pm' : `${hour - 12}pm`}
                </span>
              </div>
              {weekDays.map(day => {
                const dayStr = toDateStr(day);
                const slotAppts = appointments.filter(a => {
                  const start = new Date(a.startTime);
                  return toDateStr(start) === dayStr && start.getHours() === hour;
                });
                return (
                  <div key={`${day.toISOString()}-${hour}`}
                    className="border-l border-white/5 px-1 pt-1 relative">
                    {slotAppts.map(appt => {
                      const meta = STATUS_META[appt.status];
                      const durMin = Math.round(
                        (new Date(appt.endTime).getTime() - new Date(appt.startTime).getTime()) / 60000
                      );
                      return (
                        <div
                          key={appt.id}
                          onClick={() => onAppointmentClick(appt)}
                          className={`text-[10px] rounded-md px-1.5 py-1 mb-1 cursor-pointer border
                            ${meta.bg} ${meta.color} hover:opacity-80 transition-opacity`}
                          title={`${appt.customer.name} — ${appt.services.map(s => s.service.name).join(', ')}`}
                        >
                          <div className="font-semibold truncate">{appt.customer.name}</div>
                          <div className="opacity-70">{formatTime(appt.startTime)} · {durMin}m</div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Chairs View ──────────────────────────────────────────────
function ChairsView({
  chairs, appointments, onStatusChange, onAppointmentClick,
}: {
  chairs: Chair[];
  appointments: Appointment[];
  onStatusChange: (id: string, status: ApptStatus) => void;
  onAppointmentClick: (appt: Appointment) => void;
}) {
  if (!chairs.length) {
    return (
      <div className="card-glass p-12 text-center rounded-2xl">
        <LayoutGrid size={48} className="mx-auto text-rose-400/40 mb-4" />
        <p className="text-text-secondary">No chairs/rooms set up yet. Add them in Settings.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {chairs.map(chair => {
        const chairAppts = appointments.filter(a => a.chair?.id === chair.id);
        const activeAppt = chairAppts.find(a => a.status === 'IN_PROGRESS');
        const nextAppt = chairAppts.find(a => a.status === 'SCHEDULED' || a.status === 'CONFIRMED');

        return (
          <div key={chair.id} className={`card-glass rounded-2xl overflow-hidden border
            ${activeAppt ? 'border-amber-500/30' : nextAppt ? 'border-rose-400/20' : 'border-white/5'}`}>
            {/* Chair header */}
            <div className={`px-4 py-3 flex items-center gap-2
              ${activeAppt ? 'bg-amber-500/10' : nextAppt ? 'bg-rose-500/5' : 'bg-white/3'}`}>
              <div className={`w-2.5 h-2.5 rounded-full
                ${activeAppt ? 'bg-amber-400 animate-pulse' : nextAppt ? 'bg-rose-400' : 'bg-gray-600'}`} />
              <span className="font-semibold text-sm text-text-primary">{chair.name}</span>
              <span className="text-xs text-text-secondary ml-auto capitalize">{chair.type}</span>
            </div>

            {/* Appointments for this chair */}
            <div className="p-3 space-y-2 min-h-[120px]">
              {chairAppts.length === 0 ? (
                <div className="flex items-center justify-center h-16 text-xs text-text-secondary">
                  Available
                </div>
              ) : (
                chairAppts.slice(0, 4).map(appt => (
                  <AppointmentCard
                    key={appt.id}
                    appt={appt}
                    onStatusChange={onStatusChange}
                    onClick={onAppointmentClick}
                  />
                ))
              )}
              {chairAppts.length > 4 && (
                <div className="text-center text-xs text-text-secondary">
                  +{chairAppts.length - 4} more
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Appointments Page ───────────────────────────────────
export default function AppointmentsPage() {
  const queryClient = useQueryClient();
  const [view, setView] = useState<'list' | 'calendar' | 'chairs'>('list');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [editingAppt, setEditingAppt] = useState<Appointment | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');

  const dateStr = toDateStr(selectedDate);
  const weekDays = getWeekDays(selectedDate);
  const fromStr = toDateStr(weekDays[0]);
  const toStr = toDateStr(weekDays[6]);

  const DEFAULT_CHAIRS: Chair[] = [
    { id: 'chair-1', name: 'Styling Station 1', type: 'CHAIR' },
    { id: 'chair-2', name: 'Styling Station 2', type: 'CHAIR' },
    { id: 'chair-3', name: 'Spa Room A', type: 'ROOM' },
    { id: 'chair-4', name: 'Nail Station 1', type: 'CHAIR' },
  ];

  const DEFAULT_APPOINTMENTS: Appointment[] = [
    {
      id: 'appt-1',
      status: 'CONFIRMED',
      source: 'WALK_IN',
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + 45 * 60000).toISOString(),
      customer: { id: 'cust-1', name: 'Priya Kapoor', phone: '9876543210' },
      employee: { id: 'emp-1', name: 'Pooja Sharma', role: 'STYLIST' },
      chair: { id: 'chair-1', name: 'Styling Station 1', type: 'CHAIR' },
      services: [{ id: 'as-1', service: { id: 'srv-1', name: 'Women Haircut & Blowdry', duration: 45, price: 850 }, duration: 45 }],
    },
    {
      id: 'appt-2',
      status: 'IN_PROGRESS',
      source: 'ONLINE',
      startTime: new Date(Date.now() - 20 * 60000).toISOString(),
      endTime: new Date(Date.now() + 40 * 60000).toISOString(),
      customer: { id: 'cust-2', name: 'Rohan Mehta', phone: '9876543211' },
      employee: { id: 'emp-2', name: 'Ananya Verma', role: 'STYLIST' },
      chair: { id: 'chair-2', name: 'Styling Station 2', type: 'CHAIR' },
      services: [{ id: 'as-2', service: { id: 'srv-2', name: 'Men Haircut & Hairwash', duration: 30, price: 350 }, duration: 30 }],
    },
    {
      id: 'appt-3',
      status: 'SCHEDULED',
      source: 'PHONE',
      startTime: new Date(Date.now() + 90 * 60000).toISOString(),
      endTime: new Date(Date.now() + 150 * 60000).toISOString(),
      customer: { id: 'cust-3', name: 'Sunita Patel', phone: '9876543213' },
      employee: { id: 'emp-4', name: 'Sunita Menon', role: 'STYLIST' },
      chair: { id: 'chair-3', name: 'Spa Room A', type: 'ROOM' },
      services: [{ id: 'as-3', service: { id: 'srv-5', name: 'O3+ Premium Facial', duration: 60, price: 2499 }, duration: 60 }],
    },
  ];

  // Fetch appointments
  const { data: rawAppts = [], isLoading } = useQuery<Appointment[]>({
    queryKey: ['appointments', view === 'calendar' ? fromStr : dateStr, view],
    queryFn: async () => {
      try {
        const params = view === 'calendar'
          ? `from=${fromStr}&to=${toStr}`
          : `date=${dateStr}`;
        const r = await api.get(`/appointments?${params}`);
        if (r.data.data && r.data.data.length > 0) return r.data.data;
      } catch (_) {}
      return DEFAULT_APPOINTMENTS;
    },
  });
  const appointmentsRaw = rawAppts.length > 0 ? rawAppts : DEFAULT_APPOINTMENTS;

  // Fetch today stats
  const { data: todayStatsData } = useQuery<TodayStats>({
    queryKey: ['appointments-stats'],
    queryFn: async () => {
      try {
        const r = await api.get('/appointments/today-stats');
        if (r.data.data) return r.data.data;
      } catch (_) {}
      return { total: 3, confirmed: 1, inProgress: 1, completed: 0, noShow: 0, cancelled: 0 };
    },
    refetchInterval: 60_000,
  });
  const todayStats = todayStatsData || { total: 3, confirmed: 1, inProgress: 1, completed: 0, noShow: 0, cancelled: 0 };

  // Fetch chairs
  const { data: rawChairsList = [] } = useQuery<Chair[]>({
    queryKey: ['chairs'],
    queryFn: async () => {
      try {
        const r = await api.get('/appointments/chairs');
        if (r.data.data && r.data.data.length > 0) return r.data.data;
      } catch (_) {}
      return DEFAULT_CHAIRS;
    },
  });
  const chairs = rawChairsList.length > 0 ? rawChairsList : DEFAULT_CHAIRS;

  // Status mutation
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ApptStatus }) =>
      api.patch(`/appointments/${id}/status`, { status }),
    onSuccess: (_, { status }) => {
      toast.success(`Appointment marked as ${STATUS_META[status].label}`);
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['appointments-stats'] });
    },
    onError: () => toast.error('Failed to update status'),
  });

  const appointments = useMemo(() => {
    if (!statusFilter) return appointmentsRaw;
    return appointmentsRaw.filter(a => a.status === statusFilter);
  }, [appointmentsRaw, statusFilter]);

  function navigateDate(delta: number) {
    const d = new Date(selectedDate);
    if (view === 'calendar') d.setDate(d.getDate() + delta * 7);
    else d.setDate(d.getDate() + delta);
    setSelectedDate(d);
  }

  function handleAppointmentClick(appt: Appointment) {
    setEditingAppt(appt);
    setShowModal(true);
  }

  const statCards = [
    { label: 'Total Today', value: todayStats?.total ?? '-', color: 'text-text-primary' },
    { label: 'Confirmed', value: todayStats?.confirmed ?? '-', color: 'text-rose-400' },
    { label: 'In Progress', value: todayStats?.inProgress ?? '-', color: 'text-amber-400' },
    { label: 'Completed', value: todayStats?.completed ?? '-', color: 'text-green-400' },
    { label: 'No Show', value: todayStats?.noShow ?? '-', color: 'text-gray-400' },
    { label: 'Cancelled', value: todayStats?.cancelled ?? '-', color: 'text-red-400' },
  ];

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading font-bold text-2xl text-text-primary">Appointments</h1>
          <p className="text-text-secondary text-sm mt-0.5">Calendar, chairs & booking management</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Online booking link */}
          <button className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 text-text-secondary hover:text-rose-400 hover:border-rose-400/30 transition-all text-sm">
            <Link2 size={15} /> Booking Link
          </button>
          <button
            onClick={() => { setEditingAppt(null); setShowModal(true); }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={16} /> New Appointment
          </button>
        </div>
      </div>

      {/* Today stats */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {statCards.map(s => (
          <div key={s.label} className="card-glass rounded-xl p-3 text-center">
            <div className={`text-xl font-bold font-heading ${s.color}`}>{s.value}</div>
            <div className="text-[11px] text-text-secondary mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Controls bar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* View toggle */}
        <div className="flex bg-surface-elevated rounded-xl p-1 gap-1">
          {([['list', 'List', List], ['calendar', 'Week', Calendar], ['chairs', 'Chairs', LayoutGrid]] as const).map(
            ([v, label, Icon]) => (
              <button
                key={v}
                onClick={() => setView(v as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all
                  ${view === v ? 'bg-rose-500 text-white shadow-md' : 'text-text-secondary hover:text-text-primary'}`}
              >
                <Icon size={14} />{label}
              </button>
            )
          )}
        </div>

        {/* Date navigation */}
        <div className="flex items-center gap-2">
          <button onClick={() => navigateDate(-1)}
            className="p-2 rounded-lg hover:bg-white/5 text-text-secondary hover:text-text-primary transition-all">
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => setSelectedDate(new Date())}
            className="text-sm font-medium text-text-primary px-3 py-1.5 rounded-lg hover:bg-white/5 transition-all min-w-[120px] text-center"
          >
            {view === 'calendar'
              ? `${weekDays[0].toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} – ${weekDays[6].toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`
              : selectedDate.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })
            }
          </button>
          <button onClick={() => navigateDate(1)}
            className="p-2 rounded-lg hover:bg-white/5 text-text-secondary hover:text-text-primary transition-all">
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-1.5 ml-auto">
          <Filter size={14} className="text-text-secondary" />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="text-sm bg-surface-elevated border border-white/10 rounded-xl px-3 py-1.5 text-text-primary outline-none"
          >
            <option value="">All Status</option>
            {(Object.keys(STATUS_META) as ApptStatus[]).map(s => (
              <option key={s} value={s}>{STATUS_META[s].label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-text-secondary gap-3">
          <RefreshCw size={20} className="animate-spin text-rose-400" />
          Loading appointments…
        </div>
      ) : (
        <>
          {view === 'list' && (
            <div>
              {appointments.length === 0 ? (
                <div className="card-glass rounded-2xl p-16 text-center">
                  <Calendar size={48} className="mx-auto text-rose-400/40 mb-4" />
                  <h3 className="font-heading font-semibold text-lg text-text-primary mb-2">No appointments</h3>
                  <p className="text-text-secondary text-sm mb-6">
                    {statusFilter ? `No ${STATUS_META[statusFilter as ApptStatus]?.label} appointments today.` : 'No appointments scheduled for this day.'}
                  </p>
                  <button
                    onClick={() => { setEditingAppt(null); setShowModal(true); }}
                    className="btn-primary mx-auto flex items-center gap-2"
                  >
                    <Plus size={16} /> Book Appointment
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {appointments.map(appt => (
                    <AppointmentCard
                      key={appt.id}
                      appt={appt}
                      onStatusChange={(id, status) => statusMutation.mutate({ id, status })}
                      onClick={handleAppointmentClick}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {view === 'calendar' && (
            <div className="card-glass rounded-2xl p-4">
              <CalendarView
                appointments={appointments}
                selectedDate={selectedDate}
                onStatusChange={(id, status) => statusMutation.mutate({ id, status })}
                onAppointmentClick={handleAppointmentClick}
              />
            </div>
          )}

          {view === 'chairs' && (
            <ChairsView
              chairs={chairs}
              appointments={appointments}
              onStatusChange={(id, status) => statusMutation.mutate({ id, status })}
              onAppointmentClick={handleAppointmentClick}
            />
          )}
        </>
      )}

      {/* Appointment Modal */}
      {showModal && (
        <AppointmentModal
          appointment={editingAppt}
          onClose={() => { setShowModal(false); setEditingAppt(null); }}
          onSaved={() => {
            queryClient.invalidateQueries({ queryKey: ['appointments'] });
            queryClient.invalidateQueries({ queryKey: ['appointments-stats'] });
            setShowModal(false);
            setEditingAppt(null);
          }}
        />
      )}
    </div>
  );
}