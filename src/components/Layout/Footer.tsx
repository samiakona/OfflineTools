import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="h-10 bg-gradient-to-r from-slate-50 via-white to-slate-50 border-t border-slate-200/70 flex items-center justify-center px-6 shrink-0 text-[11px] font-medium text-slate-500 z-30 select-none">
      
      {/* Centered Copyright & Branding */}
      <div className="flex items-center gap-1">
        <span>&copy; {new Date().getFullYear()}</span>
        <span className="font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
          HemaiyaOffline
        </span>
        <span className="text-slate-400">| All Rights Reserved.</span>
      </div>

    </footer>
  );
};