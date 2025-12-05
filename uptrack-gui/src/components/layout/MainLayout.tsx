import React, { useState } from 'react';
import MobileHeader from './MobileHeader';
import Sidebar from './Sidebar';
import { Content } from '../ui/Content';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isDesktopOpen, setIsDesktopOpen] = useState(true);

  return (
    <div className="flex h-screen bg-background text-text-main font-sans overflow-hidden">
      <MobileHeader 
        isMobileOpen={isMobileOpen} 
        setIsMobileOpen={setIsMobileOpen}
        isDesktopOpen={isDesktopOpen}
        setIsDesktopOpen={setIsDesktopOpen}
      />
      <Sidebar
        isDesktopOpen={isDesktopOpen}
        setIsDesktopOpen={setIsDesktopOpen}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      {/* Main Layout */}
      <main className="flex-1 overflow-y-auto h-full relative transition-all duration-300 pt-16">
        <Content>
          {children}
        </Content>
      </main>
    </div>
  );
};

export default MainLayout;