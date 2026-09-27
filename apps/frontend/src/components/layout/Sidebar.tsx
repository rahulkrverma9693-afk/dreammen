import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Receipt, Calendar, Users, Megaphone,
  BarChart3, Package, Settings, ChevronLeft, ChevronRight,
  Scissors, LogOut,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { cn } from '../../utils/cn';

interface NavItem {
  to: string;
  icon: React.ElementType;
  label: string;
  roles?: string[];
}

const navItems: NavItem[] = [
  { to: '/',            icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/billing',     icon: Receipt,         label: 'Billing' },
  { to: '/appointments',icon: Calendar,        label: 'Appointments' },
  { to: '/customers',   icon: Users,           label: 'Customers' },
  { to: '/marketing',   icon: Megaphone,       label: 'Marketing' },
  { to: '/reports',     icon: BarChart3,       label: 'Reports' },
  { to: '/inventory',   icon: Package,         label: 'Inventory' },
  { to: '/settings',    icon: Settings,        label: 'Settings' },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-full z-40 flex flex-col transition-all duration-300',
        'bg-white border-r border-primary-100/50 shadow-nav',
        collapsed ? 'w-[72px]' : 'w-[260px]'
      )}
    >
      {/* Brand Header */}
      <div className={cn(
        'flex items-center h-16 border-b border-primary-100/50 px-4',
        collapsed ? 'justify-center' : 'justify-between'
      )}>
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-rose-gradient flex items-center justify-center shadow-card">
              <Scissors size={16} className="text-white" />
            </div>
            <div>
              <p className="font-heading font-bold text-sm text-gradient-rose leading-tight">DreamGirl</p>
              <p className="text-[10px] text-text-secondary font-medium">Family Salon</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-9 h-9 rounded-full bg-rose-gradient flex items-center justify-center shadow-card">
            <Scissors size={18} className="text-white" />
          </div>
        )}
        {!collapsed && (
          <button onClick={onToggle} className="p-1.5 rounded-card hover:bg-rose-panel text-text-secondary hover:text-primary transition-colors">
            <ChevronLeft size={18} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {navItems.map((item) => {
          if (item.roles && !item.roles.includes(user?.role || '')) return null;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center rounded-card transition-all duration-200 cursor-pointer',
                  collapsed ? 'justify-center px-2 py-3' : 'gap-3 px-3 py-2.5',
                  isActive
                    ? 'bg-rose-gradient text-white shadow-card font-semibold'
                    : 'text-text-secondary hover:bg-rose-panel hover:text-primary font-medium'
                )
              }
              title={collapsed ? item.label : undefined}
            >
              {({ isActive }) => (
                <>
                  <item.icon size={20} className={isActive ? 'text-white' : ''} />
                  {!collapsed && <span className="text-sm">{item.label}</span>}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User Footer */}
      <div className={cn(
        'border-t border-primary-100/50 p-3',
        collapsed ? 'flex justify-center' : ''
      )}>
        {!collapsed ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-rose-gradient flex items-center justify-center text-white text-xs font-bold">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">{user?.name}</p>
                <p className="text-xs text-text-secondary capitalize">{user?.role?.toLowerCase()}</p>
              </div>
            </div>
            <button onClick={handleLogout} className="p-1.5 rounded-card hover:bg-red-50 text-text-secondary hover:text-red-500 transition-colors" title="Logout">
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <button onClick={onToggle} className="p-2 rounded-card hover:bg-rose-panel text-text-secondary hover:text-primary transition-colors">
            <ChevronRight size={18} />
          </button>
        )}
      </div>
    </aside>
  );
}
