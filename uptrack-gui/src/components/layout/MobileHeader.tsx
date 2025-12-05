import React from 'react';
import { Menu, X } from 'lucide-react';

interface MobileHeaderProps {
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

const MobileHeader: React.FC<MobileHeaderProps> = ({ isMobileOpen, setIsMobileOpen }) => {
  return (
    <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-background-surface border-b border-border-dark">
      <div className="flex items-center justify-between p-4">
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-2.5 bg-background-card rounded-lg border border-border-dark text-text-main shadow-lg hover:bg-background-hover transition-colors"
        >
          {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        <div className="flex items-center gap-3">
          <div className="w-8 h-8 flex-shrink-0 rounded-full bg-background-hover ring-2 ring-border-dark"></div>
          <div className="flex flex-col overflow-hidden min-w-0">
            <h1 className="text-text-main font-semibold text-xs truncate">User</h1>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileHeader;