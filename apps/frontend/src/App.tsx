import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import AppLayout from './components/layout/AppLayout';
import LoginPage from './pages/auth/LoginPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import CustomersPage from './pages/customers/CustomersPage';
import CustomerProfilePage from './pages/customers/CustomerProfilePage';
import BillingPage from './pages/billing/BillingPage';
import AppointmentsPage from './pages/appointments/AppointmentsPage';
import ReportsPage from './pages/reports/ReportsPage';
import InventoryPage from './pages/inventory/InventoryPage';
import MarketingPage from './pages/marketing/MarketingPage';
import SettingsPage from './pages/settings/SettingsPage';
import BookingPage from './pages/booking/BookingPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function GuestRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return !isAuthenticated ? <>{children}</> : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
        <Route path="/book" element={<BookingPage />} />

        {/* Protected App Routes */}
        <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route index element={<DashboardPage />} />
          <Route path="billing" element={<BillingPage />} />
          <Route path="appointments" element={<AppointmentsPage />} />
          <Route path="customers" element={<CustomersPage />} />
          <Route path="customers/:id" element={<CustomerProfilePage />} />
          <Route path="marketing" element={<MarketingPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
