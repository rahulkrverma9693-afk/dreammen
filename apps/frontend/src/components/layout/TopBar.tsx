import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Bell, Plus, Receipt, UserPlus, DollarSign, Calendar, Bell as BellIcon } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { cn } from '../../utils/cn';

const quickAddItems = [
  { label: 'New Bill',        icon: Receipt,    to: '/billing?new=1' },
  { label: 'New Customer',    icon: UserPlus,   to: '/customers?new=1' },
  { label: 'Log Expense',     icon: DollarSign, to: '/?expense=1' },
  { label: 'Appointment',     icon: Calendar,   to: '/appointments?new=1' },
  { label: 'Reminder',        icon: BellIcon,   to: '/?reminder=1' },
];

interface TopBarProps {
  onMenuClick: () => void;
}

export default function TopBar({ onMenuClick }: TopBarProps) {
  const { user } = useAuthStore();
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const navigate = useNavigate();

  return (
    <header className="h-16 bg-white border-b border-primary-100/50 shadow-nav flex items-center px-6 gap-4 z-30 sticky top-0">
      {/* Menu Toggle */}
      <button
        onClick={onMenuClick}
        className="p-2 rounded-card hover:bg-rose-panel text-text-secondary hover:text-primary transition-colors"
      >
        <Menu size={20} />
      </button>

      {/* Branch Name */}
      <div className="flex-1">
        <p className="font-heading font-semibold text-sm text-text-primary">{user?.branchName || 'DreamGirl Salon'}</p>
        <p className="text-xs text-text-secondary capitalize">{user?.role?.toLowerCase()} portal</p>
      </div>

      {/* Quick Add Button */}
      <div className="relative">
        <button
          onClick={() => setShowQuickAdd(v => !v)}
          className="btn-primary flex items-center gap-2 text-sm"
        >
          <Plus size={18} />
          <span className="hidden sm:inline">Quick Add</span>
        </button>

        {/* Quick Add Dropdown */}
        {showQuickAdd && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowQuickAdd(false)}
            />
            <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-card shadow-card-hover border border-primary-100/50 py-2 z-50 animate-fade-up">
              {quickAddItems.map((item) => (
                <button
                  key={item.label}
                  onClick={() => {
                    navigate(item.to);
                    setShowQuickAdd(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:bg-rose-panel hover:text-primary transition-colors"
                >
                  <item.icon size={16} />
                  {item.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Notifications */}
      <button className="relative p-2 rounded-card hover:bg-rose-panel text-text-secondary hover:text-primary transition-colors">
        <Bell size={20} />
        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full animate-pulse-rose" />
      </button>
    </header>
  );
}
