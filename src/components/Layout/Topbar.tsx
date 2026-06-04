import React from 'react';
import { Download, Upload } from 'lucide-react';

interface TopbarProps {
  onExportClick: () => void;
  onImportClick: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onExportClick, onImportClick }) => {
  return (
    <header className="h-16 bg-gradient-to-r from-slate-50 via-white to-slate-50 border-b border-slate-200/80 flex items-center justify-between px-6 shrink-0 shadow-sm z-30 sticky top-0">
      
      {/* Left: Active Offline Mode */}
      <div className="flex items-center">
        <p className="text-xs text-indigo-700 font-semibold bg-indigo-50/80 border border-indigo-100 px-3 py-1 rounded-full flex items-center gap-2 shadow-xs">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600"></span>
          </span>
          Offline Mode Active
        </p>
      </div>

      {/* Middle: Brand Title */}
      <div className="absolute left-1/2 transform -translate-x-1/2 hidden md:block">
        <h1 className="text-xl font-extrabold text-slate-800 tracking-tight bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
          Child Welfare
        </h1>
      </div>

      {/* Right: Export & Import Buttons */}
      <div className="flex items-center gap-2.5">
        {/* Export Button (Secondary Action) */}
        <button
          onClick={onExportClick}
          title="Export Backup"
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg transition-all duration-200 shadow-sm active:scale-95"
        >
          <Download size={14} className="text-slate-500" />
          <span>Export</span>
        </button>

        {/* Import Button (Primary Action - Dynamic Blue Accent) */}
        <button
          onClick={onImportClick}
          title="Import Backup"
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all duration-200 shadow-sm shadow-blue-100 hover:shadow-md active:scale-95"
        >
          <Upload size={14} className="text-white/90" />
          <span>Import</span>
        </button>
      </div>
    </header>
  );
};