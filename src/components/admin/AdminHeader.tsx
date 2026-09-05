import React from 'react';
import { Menu, Sprout, Bell } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface AdminHeaderProps {
  title: string;
  subtitle?: string;
  onOpenMobileSidebar: () => void;
  actions?: React.ReactNode;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  title,
  subtitle,
  onOpenMobileSidebar,
  actions,
}) => {
  const { user } = useAuth();

  return (
    <header className="bg-white border-b border-[#E7E2D8] sticky top-0 z-30 px-4 sm:px-8 py-4">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Mobile trigger & Page titles */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMobileSidebar}
            className="md:hidden p-2 rounded-lg text-[#5A6858] hover:bg-[#F2ECE4] transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-serif font-bold text-[#232D24]">{title}</h1>
            {subtitle && <p className="text-xs text-[#6F7D6D] hidden sm:block mt-0.5">{subtitle}</p>}
          </div>
        </div>

        {/* Right: Actions and Status */}
        <div className="flex items-center gap-3 sm:gap-4">
          {actions}
          <div className="h-6 w-px bg-[#E2DBD0] hidden sm:block" />
          <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-[#465444] bg-[#F4EFE6] px-3 py-1.5 rounded-full border border-[#E4DCCE]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Mock API Conectada</span>
          </div>
        </div>
      </div>
    </header>
  );
};
