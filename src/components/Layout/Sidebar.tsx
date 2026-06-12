import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, ClipboardList, X } from 'lucide-react';

interface SidebarProps {
  onClose?: () => void; // মোবাইলের জন্য ক্লোজ হ্যান্ডলার প্রপ্স
}

export const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  
  // একটি কমন স্টাইলিং ফাংশন, যা অ্যাক্টিভ রাউট ট্র্যাক করে ব্যাকগ্রাউন্ড হাইলাইট করবে
  const navLinkClass = ({ isActive }: { isActive: boolean }) => `
    flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all duration-200
    ${isActive 
      ? 'bg-blue-50 text-blue-700 shadow-2xs border border-blue-100/50' 
      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent'}
  `;

  return (
    <div className="w-64 h-full border-r border-slate-200/60 bg-white flex flex-col relative">
      
      {/* মোবাইল স্ক্রিনের জন্য ক্লোজ বাটন */}
      <div className="p-4 flex items-center justify-between border-b border-slate-100 lg:py-6">
        <span className="font-black text-slate-900 tracking-wider text-base uppercase">
          CaseManager
        </span>
        <button 
          onClick={onClose}
          className="p-1.5 bg-slate-50 border border-slate-200 text-slate-500 rounded-lg lg:hidden"
        >
          <X size={16} />
        </button>
      </div>

      {/* মেনু আইটেম লিস্ট */}
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        
        {/* ১. হোম বা কেস নোটস লিস্ট */}
        <NavLink to="/" onClick={onClose} className={navLinkClass}>
          <Home size={16} strokeWidth={2.5} />
          <span>Dashboard / Notes</span>
        </NavLink>
   {/* ৩. নতুন নোট ক্রিয়েট করার কুইক লিঙ্ক */}
        {/* <NavLink to="/add-note" onClick={onClose} className={navLinkClass}>
          <FileText size={16} strokeWidth={2.5} />
          <span>Create Case Note</span>
        </NavLink> */}
        {/* ২. নতুন মেনু: Assessments */}
        <NavLink to="/assessments" onClick={onClose} className={navLinkClass}>
          <ClipboardList size={16} strokeWidth={2.5} />
          <span>Home Assessments</span>
        </NavLink>
<NavLink to="/threat-assessment" onClick={onClose} className={navLinkClass}>
          <ClipboardList size={16} strokeWidth={2.5} />
          <span>Threat Assessments</span>
        </NavLink>
        <NavLink to="/home-study-assessment" onClick={onClose} className={navLinkClass}>
          <ClipboardList size={16} strokeWidth={2.5} />
          <span>FC - Home Study</span>
        </NavLink>
        <NavLink to="/thcvreat" onClick={onClose} className={navLinkClass}>
          <ClipboardList size={16} strokeWidth={2.5} />
          <span>FC-Visit Notes</span>
        </NavLink>
     

      </nav>

      {/* সাইডবার ফুটার বা প্রোফাইল সেকশন */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
            MS
          </div>
          <div>
            <p className="text-xs font-bold text-slate-800">Masum_Sup</p>
            <p className="text-[10px] font-medium text-slate-400">Supervisor</p>
          </div>
        </div>
      </div>
    </div>
  );
};