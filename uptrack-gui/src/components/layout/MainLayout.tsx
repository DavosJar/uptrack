import React, { useState, useEffect } from 'react';
import MobileHeader from './MobileHeader';
import Sidebar from './Sidebar';
import { Content } from '../ui/Content';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isDesktopOpen, setIsDesktopOpen] = useState(window.innerWidth >= 1300);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 1300px)');
    
    const handler = (e: MediaQueryListEvent) => {
      setIsDesktopOpen(e.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return (
    <div className="flex h-screen bg-background text-text-main font-sans overflow-hidden print:h-auto print:overflow-visible print:bg-white print:text-black">
      <div className="print:hidden">
        <MobileHeader 
          isMobileOpen={isMobileOpen} 
          setIsMobileOpen={setIsMobileOpen}
          isDesktopOpen={isDesktopOpen}
          setIsDesktopOpen={setIsDesktopOpen}
        />
      </div>
      <div className="print:hidden">
        <Sidebar
          isDesktopOpen={isDesktopOpen}
          setIsDesktopOpen={setIsDesktopOpen}
          isMobileOpen={isMobileOpen}
          setIsMobileOpen={setIsMobileOpen}
        />
      </div>

      {/* Main Layout */}
      <main 
        className={`flex-1 overflow-y-auto h-[calc(100vh-4rem)] mt-16 relative transition-all duration-300 print:pt-0 print:ml-0 print:h-auto print:overflow-visible ${
          isDesktopOpen ? 'lg:ml-64' : 'lg:ml-0'
        }`}
      >
        <Content>
          {children}
        </Content>
      </main>
    </div>
  );
};

export default MainLayout;