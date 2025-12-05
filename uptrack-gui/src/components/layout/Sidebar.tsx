import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, Monitor, Settings, Bell, BarChart, User, PanelLeftClose, PanelLeftOpen, LogOut } from 'lucide-react';

interface SidebarProps {
  isDesktopOpen: boolean;
  setIsDesktopOpen: (open: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isDesktopOpen, setIsDesktopOpen, isMobileOpen, setIsMobileOpen }) => {
  const navigate = useNavigate();
  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Monitor, label: 'Systems', path: '/systems' },
    { icon: BarChart, label: 'Reports', path: '/dashboard' },
    { icon: User, label: 'Profile', path: '/profile' },
    { icon: Settings, label: 'Settings', path: '/dashboard' },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      <div
        className={`lg:hidden fixed inset-0 bg-black z-30 transition-opacity duration-300 ${isMobileOpen ? 'opacity-70 backdrop-blur-sm' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsMobileOpen(false)}
      />

      {/* Sidebar */}
      <div className={`fixed top-16 left-0 h-[calc(100vh-4rem)] bg-background border-r border-border-dark transition-all duration-300 z-40 overflow-hidden ${isMobileOpen ? 'w-64' : 'w-0'} ${isDesktopOpen ? 'lg:w-64' : 'lg:w-0'}`}>
        <div className="flex flex-col h-full">
          <nav className="flex-1 p-4 pt-6">
            <ul className="space-y-2">
              {navItems.map((item) => (
                <li key={item.label}>
                  <button
                    className="w-full flex items-center gap-3 p-3 text-text-muted hover:bg-background-hover hover:text-text-main rounded-lg transition-colors"
                    onClick={() => { navigate(item.path); setIsMobileOpen(false); }}
                  >
                    <item.icon size={20} />
                    <span> {item.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>
          <div className="p-4 border-t border-border-dark">
            <button
              className="w-full flex items-center gap-3 p-3 text-text-muted hover:bg-background-hover hover:text-text-main rounded-lg transition-colors"
              onClick={() => {
                localStorage.removeItem('token');
                navigate('/login');
                setIsMobileOpen(false);
              }}
            >
              <LogOut size={20} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;