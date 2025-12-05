import React, { useState, useEffect } from 'react';
import { Menu, X, Monitor, Plus, User, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface MobileHeaderProps {
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  isDesktopOpen: boolean;
  setIsDesktopOpen: (open: boolean) => void;
}

const MobileHeader: React.FC<MobileHeaderProps> = ({ isMobileOpen, setIsMobileOpen, isDesktopOpen, setIsDesktopOpen }) => {
  const navigate = useNavigate();
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);
  const sidebarActive = isDesktop ? isDesktopOpen : isMobileOpen;

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <>
      {/* Navbar fijo estilo YouTube */}
      <div className="fixed top-0 left-0 right-0 h-16 bg-background-surface border-b border-border-dark flex items-center px-4 gap-4" style={{ zIndex: 45 }}>
        {/* Botón hamburguesa - cambia de z-index según sidebar */}
        <button
          onClick={() => {
            if (isDesktop) {
              setIsDesktopOpen(!isDesktopOpen);
            } else {
              setIsMobileOpen(!isMobileOpen);
            }
          }}
          className="p-2 rounded-lg text-text-main hover:bg-background-hover transition-colors"
          style={{ zIndex: sidebarActive ? 50 : 'auto' }}
        >
          {sidebarActive ? <X size={20} /> : <Menu size={20} />}
        </button>

        {/* Logo - cambia de z-index según sidebar */}
        <div 
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => navigate('/dashboard')}
          style={{ zIndex: sidebarActive ? 50 : 'auto' }}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Monitor className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white hidden sm:block">UpTrack</span>
        </div>

        {/* Espaciador */}
        <div className="flex-1"></div>

        {/* Botón Agregar Sistema */}
        <button
          onClick={() => navigate('/add-target')}
          className="flex items-center gap-2 px-3 sm:px-4 h-10 bg-primary hover:bg-primary-hover text-white rounded-lg font-medium transition-colors"
        >
          <Plus size={18} />
          <span className="hidden sm:inline">Agregar Sistema</span>
        </button>

        {/* Botón de notificaciones */}
        <button className="relative p-2 rounded-lg text-text-main hover:bg-background-hover transition-colors">
          <Bell size={20} />
          {/* Badge de notificaciones (opcional) */}
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        {/* Botón de perfil */}
        <button className="p-2 rounded-full bg-background-hover hover:bg-border-dark transition-colors">
          <User size={20} className="text-text-main" />
        </button>
      </div>
    </>
  );
};

export default MobileHeader;