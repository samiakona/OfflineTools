import React from 'react';
import { Download, Upload, Menu, Database } from 'lucide-react';

interface TopbarProps {
  onExportClick: () => void;
  onImportClick: () => void;
  onMenuClick: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onExportClick, onImportClick, onMenuClick }) => {
  return (
    <header className="h-16 bg-gradient-to-r from-slate-50 via-white to-slate-50 border-b border-emerald-200/60 flex items-center justify-between px-3 sm:px-6 shrink-0 shadow-xs z-30 sticky top-0">
      
      {/* Left Section: Hamburger & Branding */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        {/* 🍔 হ্যামবার্গার বাটন (মোবাইল ও ট্যাবলেটে দেখাবে) */}
        <button
          onClick={onMenuClick}
          title="Open Sidebar"
          className="p-2 -ml-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl lg:hidden transition-all duration-150 active:scale-95 cursor-pointer"
        >
          <Menu size={20} />
        </button>

        {/* Brand Title: মোবাইল এবং ডেক্সটপ সবখানেই দেখাবে */}
 
      </div>

      {/* Middle Section: New Emerald HemaiyaOffline Badge */}
      <div className="flex items-center justify-center px-1 sm:px-2">
        <div className="flex items-center gap-1.5 bg-emerald-50/90 border border-emerald-200/80 px-2.5 py-1 sm:px-3 rounded-xl shadow-3xs">
          {/* লাইভ অফলাইন পালসিং অ্যানিমেশন ডট (Emerald Green) */}
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
          </span>
          
          {/* ডাটাবেজ আইকন */}
          <Database size={11} className="text-emerald-600 hidden xs:block" />
          
          {/* আপনার কাস্টম টেক্সট */}
          <span className="text-[10px] sm:text-xs text-emerald-800 font-extrabold uppercase tracking-wider">
            HemaiyaOffline
          </span>
        </div>
      </div>

      {/* Right Section: Export & Import Buttons */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        {/* Export Button */}
        <button
          onClick={onExportClick}
          title="Export Backup"
          className="flex items-center gap-2 px-2.5 py-2 sm:px-3.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl transition-all duration-200 shadow-2xs active:scale-95 cursor-pointer"
        >
          <Download size={13} className="text-slate-500" />
          <span className="hidden sm:inline">Export</span>
        </button>

        {/* Import Button */}
        <button
          onClick={onImportClick}
          title="Import Backup"
          className="flex items-center gap-2 px-2.5 py-2 sm:px-3.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all duration-200 shadow-sm shadow-blue-600/10 active:scale-95 cursor-pointer"
        >
          <Upload size={13} className="text-white/90" />
          <span className="hidden sm:inline">Import</span>
        </button>
      </div>

    </header>
  );
};