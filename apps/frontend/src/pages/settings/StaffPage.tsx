import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users, TrendingUp, Clock, Plus, Edit2, ToggleLeft, ToggleRight,
  X, Check, RefreshCw, Target, Award, Calendar, ChevronDown,
  Scissors, Star, UserCheck, UserX,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import { useAuthStore } from '../../stores/authStore';

// ─── Types ────────────────────────────────────────────────────
interface Employee {
  id: string;
  name: string;
  phone: string;
  email?: string;
  role: string;
  commissionType: string;
  commissionRate: number;
  monthlyTarget: number;
  joinDate?: string;
  photoUrl?: string;
  isActive: boolean;
}

interface EmployeePerformance {
  id: string;
  name: string;
  photoUrl?: string;
  role: string;
  commissionType: string;
  commissionRate: number;
  monthlyTarget: number;
  totalRevenue: number;
  totalServices: number;
  commissionEarned: number;
  totalHours: number;
  daysPresent: number;
  apptCompleted: number;
  apptTotal: number;
  targetAchieved: number | null;
}

interface AttendanceLog {
  id: string;
  clockIn: string;
  clockOut?: string;
  hoursWorked?: number;
  date: string;
}

// ─── Employee Form Modal ──────────────────────────────────────
function EmployeeFormModal({
  employee, onClose, onSaved,
}: { employee: Employee | null; onClose: () => void; onSaved: () => void }) {
  const isEdit = !!employee;
  const [form, setForm] = useState({
    name: employee?.name || '',
    phone: employee?.phone || '',
    email: employee?.email || '',
    role: employee?.role || 'STYLIST',
    commissionType: employee?.commissionType || 'PERCENT',
    commissionRate: employee?.commissionRate?.toString() || '0',
    monthlyTarget: employee?.monthlyTarget?.toString() || '0',
    joinDate: employee?.joinDate?.substring(0, 10) || '',
  });

  const mutation = useMutation({
    mutationFn: (data: any) => isEdit
      ? api.patch(`/employees/${employee!.id}`, data)
      : api.post('/employees', data),
    onSuccess: () => {
      toast.success(isEdit ? 'Employee updated' : 'Employee added');
      onSaved();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to save'),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    mutation.mutate({
      ...form,
      commissionRate: parseFloat(form.commissionRate),
      monthlyTarget: parseFloat(form.monthlyTarget),
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-up">
      <div className="bg-white rounded-card shadow-2xl border border-primary-100 max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
        <div className="bg-rose-gradient text-white p-4 flex items-center justify-between">
          <h3 className="font-heading font-bold text-lg text-white">
            {isEdit ? 'Edit Employee Profile' : 'Add New Employee'}
          </h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-white/20 text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wide">
                Full Name *
              </label>
              <input required type="text" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g., Priya Sharma"
                className="input-field w-full" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wide">Phone *</label>
              <input required type="tel" value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="9876543210"
                className="input-field w-full" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wide">Email</label>
              <input type="email" value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="priya@salon.com"
                className="input-field w-full" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wide">Role</label>
              <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                className="input-field w-full">
                <option value="STYLIST">Stylist</option>
                <option value="RECEPTIONIST">Receptionist</option>
                <option value="MANAGER">Manager</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wide">Join Date</label>
              <input type="date" value={form.joinDate}
                onChange={e => setForm(f => ({ ...f, joinDate: e.target.value }))}
                className="input-field w-full" />
            </div>
          </div>

          {/* Commission section */}
          <div className="p-4 bg-surface-elevated rounded-xl border border-white/5 space-y-3">
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Commission & Target</p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-text-secondary mb-1">Type</label>
                <select value={form.commissionType}
                  onChange={e => setForm(f => ({ ...f, commissionType: e.target.value }))}
                  className="input-field w-full text-sm">
                  <option value="PERCENT">Percent (%)</option>
                  <option value="FLAT">Flat (₹)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-text-secondary mb-1">
                  Rate {form.commissionType === 'PERCENT' ? '(%)' : '(₹/service)'}
                </label>
                <input type="number" min={0} step={0.5} value={form.commissionRate}
                  onChange={e => setForm(f => ({ ...f, commissionRate: e.target.value }))}
                  className="input-field w-full text-sm" />
              </div>
              <div>
                <label className="block text-xs text-text-secondary mb-1">Monthly Target (₹)</label>
                <input type="number" min={0} step={100} value={form.monthlyTarget}
                  onChange={e => setForm(f => ({ ...f, monthlyTarget: e.target.value }))}
                  className="input-field w-full text-sm" />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-sm text-text-secondary hover:border-white/20 transition-all">
              Cancel
            </button>
            <button type="submit" disabled={mutation.isPending}
              className="flex-1 btn-primary flex items-center justify-center gap-2">
              {mutation.isPending ? <RefreshCw size={15} className="animate-spin" /> : <Check size={15} />}
              {isEdit ? 'Update' : 'Add Employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Performance Card ─────────────────────────────────────────
function PerformanceCard({ emp }: { emp: EmployeePerformance }) {
  const targetPct = emp.targetAchieved ? Math.min(100, emp.targetAchieved) : 0;
  const targetColor = targetPct >= 100 ? 'bg-green-500' : targetPct >= 70 ? 'bg-amber-500' : 'bg-rose-500';

  return (
    <div className="card-glass rounded-2xl p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-rose-500 to-rose-700 flex items-center justify-center text-white font-bold text-lg">
          {emp.name.charAt(0)}
        </div>
        <div>
          <div className="font-semibold text-text-primary">{emp.name}</div>
          <div className="text-xs text-text-secondary capitalize">{emp.role.toLowerCase()}</div>
        </div>
        {emp.targetAchieved !== null && emp.targetAchieved >= 100 && (
          <Award size={18} className="ml-auto text-amber-400" />
        )}
      </div>

      {/* Target progress */}
      {emp.monthlyTarget > 0 && (
        <div>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-text-secondary">Monthly Target</span>
            <span className="font-semibold text-text-primary">
              {targetPct.toFixed(0)}% of ₹{emp.monthlyTarget.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${targetColor}`}
              style={{ width: `${targetPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-2">
        <div className="p-2.5 bg-surface-elevated rounded-xl">
          <div className="text-[10px] text-text-secondary mb-0.5">Revenue</div>
          <div className="text-sm font-bold text-text-primary">
            ₹{emp.totalRevenue.toLocaleString('en-IN')}
          </div>
        </div>
        <div className="p-2.5 bg-surface-elevated rounded-xl">
          <div className="text-[10px] text-text-secondary mb-0.5">Commission</div>
          <div className="text-sm font-bold text-rose-400">
            ₹{emp.commissionEarned.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
        </div>
        <div className="p-2.5 bg-surface-elevated rounded-xl">
          <div className="text-[10px] text-text-secondary mb-0.5">Services</div>
          <div className="text-sm font-bold text-text-primary">{emp.totalServices}</div>
        </div>
        <div className="p-2.5 bg-surface-elevated rounded-xl">
          <div className="text-[10px] text-text-secondary mb-0.5">Appointments</div>
          <div className="text-sm font-bold text-text-primary">
            {emp.apptCompleted}/{emp.apptTotal}
          </div>
        </div>
        <div className="p-2.5 bg-surface-elevated rounded-xl">
          <div className="text-[10px] text-text-secondary mb-0.5">Days Present</div>
          <div className="text-sm font-bold text-text-primary">{emp.daysPresent}</div>
        </div>
        <div className="p-2.5 bg-surface-elevated rounded-xl">
          <div className="text-[10px] text-text-secondary mb-0.5">Hours Worked</div>
          <div className="text-sm font-bold text-text-primary">{emp.totalHours.toFixed(1)}h</div>
        </div>
      </div>
    </div>
  );
}

// ─── Attendance Panel ─────────────────────────────────────────
function AttendancePanel({ employees }: { employees: Employee[] }) {
  const [selectedEmpId, setSelectedEmpId] = useState(employees[0]?.id || '');
  const queryClient = useQueryClient();

  const { data: logs = [] } = useQuery<AttendanceLog[]>({
    queryKey: ['attendance', selectedEmpId],
    queryFn: async () => {
      if (!selectedEmpId) return [];
      const r = await api.get(`/employees/${selectedEmpId}/attendance`);
      return r.data.data;
    },
    enabled: !!selectedEmpId,
  });

  const clockInMutation = useMutation({
    mutationFn: () => api.post(`/employees/${selectedEmpId}/clock-in`),
    onSuccess: () => { toast.success('Clocked in!'); queryClient.invalidateQueries({ queryKey: ['attendance', selectedEmpId] }); },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Already clocked in'),
  });

  const clockOutMutation = useMutation({
    mutationFn: () => api.post(`/employees/${selectedEmpId}/clock-out`),
    onSuccess: () => { toast.success('Clocked out!'); queryClient.invalidateQueries({ queryKey: ['attendance', selectedEmpId] }); },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Not clocked in'),
  });

  const today = new Date().toISOString().split('T')[0];
  const todayLog = logs.find(l => l.date?.substring(0, 10) === today || l.clockIn?.substring(0, 10) === today);
  const isClockedIn = todayLog && !todayLog.clockOut;
  const totalHoursThisMonth = logs.reduce((sum, l) => sum + (l.hoursWorked ? Number(l.hoursWorked) : 0), 0);

  return (
    <div className="space-y-4">
      {/* Employee selector */}
      <div className="flex items-center gap-3">
        <select
          value={selectedEmpId}
          onChange={e => setSelectedEmpId(e.target.value)}
          className="input-field flex-1"
        >
          <option value="">Select employee…</option>
          {employees.map(e => (
            <option key={e.id} value={e.id}>{e.name}</option>
          ))}
        </select>

        {/* Clock buttons */}
        {selectedEmpId && (
          <div className="flex gap-2">
            <button
              onClick={() => clockInMutation.mutate()}
              disabled={!!isClockedIn || clockInMutation.isPending}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium
                bg-green-500/10 border border-green-500/20 text-green-400
                hover:bg-green-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <UserCheck size={14} />Clock In
            </button>
            <button
              onClick={() => clockOutMutation.mutate()}
              disabled={!isClockedIn || clockOutMutation.isPending}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium
                bg-red-500/10 border border-red-500/20 text-red-400
                hover:bg-red-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <UserX size={14} />Clock Out
            </button>
          </div>
        )}
      </div>

      {/* Today status */}
      {todayLog && (
        <div className={`flex items-center gap-3 p-3 rounded-xl border ${isClockedIn ? 'bg-amber-500/10 border-amber-500/20' : 'bg-green-500/10 border-green-500/20'}`}>
          <Clock size={16} className={isClockedIn ? 'text-amber-400' : 'text-green-400'} />
          <div className="text-sm">
            <span className={isClockedIn ? 'text-amber-400' : 'text-green-400'}>
              {isClockedIn ? 'Currently working' : 'Done for the day'}
            </span>
            <span className="text-text-secondary ml-2">
              In: {new Date(todayLog.clockIn).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              {todayLog.clockOut && ` · Out: ${new Date(todayLog.clockOut).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`}
              {todayLog.hoursWorked && ` · ${Number(todayLog.hoursWorked).toFixed(1)}h`}
            </span>
          </div>
        </div>
      )}

      {/* Monthly summary */}
      {selectedEmpId && (
        <div className="flex gap-4 text-center">
          <div className="flex-1 p-3 bg-surface-elevated rounded-xl">
            <div className="text-lg font-bold text-text-primary">{logs.length}</div>
            <div className="text-xs text-text-secondary">Days Present</div>
          </div>
          <div className="flex-1 p-3 bg-surface-elevated rounded-xl">
            <div className="text-lg font-bold text-rose-400">{totalHoursThisMonth.toFixed(1)}h</div>
            <div className="text-xs text-text-secondary">Total Hours</div>
          </div>
          <div className="flex-1 p-3 bg-surface-elevated rounded-xl">
            <div className="text-lg font-bold text-text-primary">
              {logs.length > 0 ? (totalHoursThisMonth / logs.length).toFixed(1) : '0'}h
            </div>
            <div className="text-xs text-text-secondary">Avg/Day</div>
          </div>
        </div>
      )}

      {/* Log table */}
      {logs.length > 0 ? (
        <div className="overflow-hidden rounded-xl border border-white/5">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 bg-surface-elevated">
                <th className="text-left px-4 py-2.5 text-xs text-text-secondary">Date</th>
                <th className="text-left px-4 py-2.5 text-xs text-text-secondary">Clock In</th>
                <th className="text-left px-4 py-2.5 text-xs text-text-secondary">Clock Out</th>
                <th className="text-right px-4 py-2.5 text-xs text-text-secondary">Hours</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                  <td className="px-4 py-2.5 text-text-secondary text-xs">
                    {new Date(log.date || log.clockIn).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </td>
                  <td className="px-4 py-2.5 text-text-primary text-xs">
                    {new Date(log.clockIn).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-4 py-2.5 text-text-primary text-xs">
                    {log.clockOut
                      ? new Date(log.clockOut).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                      : <span className="text-amber-400">Active</span>}
                  </td>
                  <td className="px-4 py-2.5 text-right text-text-primary text-xs">
                    {log.hoursWorked ? `${Number(log.hoursWorked).toFixed(1)}h` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : selectedEmpId ? (
        <div className="text-center py-8 text-text-secondary text-sm">No attendance records this month</div>
      ) : null}
    </div>
  );
}

// ─── Main Staff Page ──────────────────────────────────────────
export default function StaffPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'team' | 'performance' | 'attendance'>('team');
  const [showModal, setShowModal] = useState(false);
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null);
  const [perfMonth, setPerfMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const canManage = user?.role === 'OWNER' || user?.role === 'MANAGER';

  // Fetch employees
  const { data: employees = [], isLoading } = useQuery<Employee[]>({
    queryKey: ['employees'],
    queryFn: async () => {
      const r = await api.get('/employees?includeInactive=true');
      return r.data.data;
    },
  });

  // Fetch performance
  const { data: performance = [], isLoading: perfLoading } = useQuery<EmployeePerformance[]>({
    queryKey: ['employee-performance', perfMonth],
    queryFn: async () => {
      const r = await api.get(`/employees/performance?month=${perfMonth}`);
      return r.data.data;
    },
    enabled: activeTab === 'performance',
  });

  // Toggle active mutation
  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.patch(`/employees/${id}`, { isActive }),
    onSuccess: (_, { isActive }) => {
      toast.success(isActive ? 'Employee activated' : 'Employee deactivated');
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
    onError: () => toast.error('Failed to update'),
  });

  const activeCount = employees.filter(e => e.isActive).length;
  const inactiveCount = employees.filter(e => !e.isActive).length;

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading font-bold text-2xl text-text-primary">Staff Management</h1>
          <p className="text-text-secondary text-sm mt-0.5">
            {activeCount} active · {inactiveCount} inactive
          </p>
        </div>
        {canManage && (
          <button
            onClick={() => { setEditEmployee(null); setShowModal(true); }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={16} /> Add Employee
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex bg-surface-elevated rounded-xl p-1 gap-1 w-fit">
        {([
          ['team', 'Team', Users],
          ['performance', 'Performance', TrendingUp],
          ['attendance', 'Attendance', Clock],
        ] as const).map(([tab, label, Icon]) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all
              ${activeTab === tab ? 'bg-rose-500 text-white shadow-md' : 'text-text-secondary hover:text-text-primary'}`}
          >
            <Icon size={15} />{label}
          </button>
        ))}
      </div>

      {/* ── Team Tab ── */}
      {activeTab === 'team' && (
        <div>
          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-text-secondary gap-2">
              <RefreshCw size={18} className="animate-spin text-rose-400" /> Loading…
            </div>
          ) : employees.length === 0 ? (
            <div className="card-glass rounded-2xl p-16 text-center">
              <Users size={48} className="mx-auto text-rose-400/40 mb-4" />
              <h3 className="font-heading font-semibold text-lg text-text-primary mb-2">No employees yet</h3>
              <p className="text-text-secondary text-sm mb-6">Add your first team member to get started.</p>
              {canManage && (
                <button onClick={() => setShowModal(true)} className="btn-primary mx-auto flex items-center gap-2">
                  <Plus size={16} /> Add Employee
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-white/5">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5 bg-surface-elevated">
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-text-secondary uppercase tracking-wide">Employee</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-text-secondary uppercase tracking-wide">Role</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-text-secondary uppercase tracking-wide">Commission</th>
                    <th className="text-right px-5 py-3.5 text-xs font-semibold text-text-secondary uppercase tracking-wide">Target</th>
                    <th className="text-right px-5 py-3.5 text-xs font-semibold text-text-secondary uppercase tracking-wide">Status</th>
                    {canManage && <th className="px-5 py-3.5 text-xs font-semibold text-text-secondary uppercase tracking-wide">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {employees.map(emp => (
                    <tr key={emp.id} className={`border-b border-white/5 hover:bg-white/2 transition-colors
                      ${!emp.isActive ? 'opacity-50' : ''}`}>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-rose-500 to-rose-700 flex items-center justify-center text-white font-bold text-sm">
                            {emp.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-medium text-sm text-text-primary">{emp.name}</div>
                            <div className="text-xs text-text-secondary">{emp.phone}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-xs px-2 py-1 rounded-lg bg-white/5 text-text-secondary capitalize">
                          {emp.role.toLowerCase()}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-text-primary">
                        {emp.commissionType === 'PERCENT'
                          ? `${emp.commissionRate}%`
                          : `₹${emp.commissionRate}/service`}
                      </td>
                      <td className="px-5 py-4 text-right text-sm text-text-primary">
                        {emp.monthlyTarget > 0 ? `₹${emp.monthlyTarget.toLocaleString('en-IN')}` : '—'}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <span className={`text-xs px-2 py-1 rounded-full border
                          ${emp.isActive
                            ? 'bg-green-500/10 border-green-500/20 text-green-400'
                            : 'bg-gray-500/10 border-gray-500/20 text-gray-400'}`}>
                          {emp.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      {canManage && (
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => { setEditEmployee(emp); setShowModal(true); }}
                              className="p-1.5 rounded-lg hover:bg-white/5 text-text-secondary hover:text-rose-400 transition-all"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => toggleMutation.mutate({ id: emp.id, isActive: !emp.isActive })}
                              className="p-1.5 rounded-lg hover:bg-white/5 text-text-secondary hover:text-rose-400 transition-all"
                            >
                              {emp.isActive ? <ToggleRight size={16} className="text-green-400" /> : <ToggleLeft size={16} />}
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Performance Tab ── */}
      {activeTab === 'performance' && (
        <div className="space-y-4">
          {/* Month picker */}
          <div className="flex items-center gap-3">
            <Calendar size={16} className="text-text-secondary" />
            <input
              type="month"
              value={perfMonth}
              onChange={e => setPerfMonth(e.target.value)}
              className="input-field text-sm"
            />
            <p className="text-text-secondary text-sm">Commission & revenue report</p>
          </div>

          {perfLoading ? (
            <div className="flex items-center justify-center py-16 text-text-secondary gap-2">
              <RefreshCw size={18} className="animate-spin text-rose-400" /> Loading performance…
            </div>
          ) : performance.length === 0 ? (
            <div className="card-glass rounded-2xl p-12 text-center">
              <TrendingUp size={48} className="mx-auto text-rose-400/40 mb-4" />
              <p className="text-text-secondary">No performance data for this period</p>
            </div>
          ) : (
            <>
              {/* Summary bar */}
              <div className="grid grid-cols-3 gap-3">
                <div className="card-glass rounded-xl p-4 text-center">
                  <div className="text-xl font-bold text-text-primary font-heading">
                    ₹{performance.reduce((s, e) => s + e.totalRevenue, 0).toLocaleString('en-IN')}
                  </div>
                  <div className="text-xs text-text-secondary mt-0.5">Total Revenue</div>
                </div>
                <div className="card-glass rounded-xl p-4 text-center">
                  <div className="text-xl font-bold text-rose-400 font-heading">
                    ₹{performance.reduce((s, e) => s + e.commissionEarned, 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </div>
                  <div className="text-xs text-text-secondary mt-0.5">Total Commission</div>
                </div>
                <div className="card-glass rounded-xl p-4 text-center">
                  <div className="text-xl font-bold text-text-primary font-heading">
                    {performance.reduce((s, e) => s + e.totalServices, 0)}
                  </div>
                  <div className="text-xs text-text-secondary mt-0.5">Total Services</div>
                </div>
              </div>

              {/* Performance cards grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {performance.map(emp => (
                  <PerformanceCard key={emp.id} emp={emp} />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Attendance Tab ── */}
      {activeTab === 'attendance' && (
        <div className="card-glass rounded-2xl p-6">
          <AttendancePanel employees={employees.filter(e => e.isActive)} />
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <EmployeeFormModal
          employee={editEmployee}
          onClose={() => { setShowModal(false); setEditEmployee(null); }}
          onSaved={() => {
            queryClient.invalidateQueries({ queryKey: ['employees'] });
            setShowModal(false);
            setEditEmployee(null);
          }}
        />
      )}
    </div>
  );
}
