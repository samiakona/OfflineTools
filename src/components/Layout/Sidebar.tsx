import React from 'react';
import { Database, LayoutDashboard, FolderHeart, Settings } from 'lucide-react';

export const Sidebar: React.FC = () => {
  return (
    <aside className="w-64 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-slate-300 flex flex-col shrink-0 h-full border-r border-slate-800/60 shadow-xl">
      
      {/* Brand Header */}
      <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800/60 bg-slate-950/40 backdrop-blur-md">
        <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl text-white shadow-md shadow-blue-500/10">
          <Database size={16} className="animate-pulse" />
        </div>
        <div className="flex flex-col">
          <span className="text-md font-extrabold text-white tracking-wider uppercase bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            Hemaiya
          </span>
          <span className="text-[10px] text-slate-500 font-medium tracking-tight -mt-0.5">Management System</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
        
        {/* Active Link */}
        <a 
          href="#" 
          className="group flex items-center gap-3 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium text-sm transition-all duration-200 shadow-md shadow-blue-600/10 active:scale-[0.98]"
        >
          <LayoutDashboard size={18} className="text-blue-100 transition-transform duration-200 group-hover:scale-105" />
          <span>Dashboard</span>
        </a>

        {/* Inactive Links */}
        <a 
          href="#" 
          className="group flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-slate-800/60 text-slate-400 hover:text-slate-100 font-medium text-sm transition-all duration-200 active:scale-[0.98]"
        >
          <FolderHeart size={18} className="text-slate-500 group-hover:text-blue-400 transition-colors duration-200" />
          <span>All Cases</span>
        </a>

        <a 
          href="#" 
          className="group flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-slate-800/60 text-slate-400 hover:text-slate-100 font-medium text-sm transition-all duration-200 active:scale-[0.98]"
        >
          <Settings size={18} className="text-slate-500 group-hover:text-blue-400 transition-colors duration-200" />
          <span>Settings</span>
        </a>

      </nav>

      {/* Footer / System Status */}
      <div className="p-4 border-t border-slate-800/60 bg-slate-950/40 flex items-center justify-between text-[11px] font-medium text-slate-500 tracking-wide">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
          Connected
        </span>
        <span className="text-slate-600">v1.0.0 (Local Build)</span>
      </div>
    </aside>
  );
};