import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

export default function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-[#FFFAFA]">
      {/* Sidebar */}
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(c => !c)} />

      {/* Main Content Area */}
      <div
        className="flex flex-col flex-1 overflow-hidden transition-all duration-300"
        style={{ marginLeft: sidebarCollapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)' }}
      >
        <TopBar onMenuClick={() => setSidebarCollapsed(c => !c)} />
        <main className="flex-1 overflow-y-auto p-6 max-w-content mx-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
