import React, { useRef, useState } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { Footer } from './Footer';
// 🌟 তৈরি করা সার্ভিস লেয়ারটি এখানে ইমপোর্ট করুন

import { caseNoteService } from '../../services/caseNoteService';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // 📤 এক্সপোর্ট হ্যান্ডলার
  const handleExport = async () => {
    try {
      // 🌟 সার্ভিসের মাধ্যমে ডেটা নিয়ে আসা
      const backupData = await caseNoteService.exportBackupData();

      const jsonString = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `case_notes_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed:", error);
      alert("Failed to export backup file.");
    }
  };

  // 📥 ইমপোর্ট ফাইল চেঞ্জ হ্যান্ডলার
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (window.confirm("Importing this file will overwrite your local data. Do you want to proceed?")) {
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        try {
          const jsonText = event.target?.result as string;
          const parsedBackup = JSON.parse(jsonText);

          // 🌟 সার্ভিসের মাধ্যমে ডাটাবেজে ওভাররাইট করা
          await caseNoteService.importBackupData(parsedBackup);

          alert("Database imported successfully!");
          window.location.reload();
        } catch (error) {
          console.error("Import failed:", error);
          alert("Error importing file! Make sure it is a valid JSON backup.");
        }
      };

      reader.readAsText(file);
    }
    e.target.value = '';
  };

  return (
    <div className="flex h-screen w-screen bg-slate-50 overflow-hidden text-slate-900 font-sans relative">
      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 transform bg-white shadow-xl transition-transform duration-300 ease-in-out
        lg:relative lg:translate-x-0 lg:shadow-none
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <Sidebar />
      </div>

      {/* Backdrop for mobile sidebar */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 h-full min-w-0 overflow-hidden">
        <Topbar
          onExportClick={handleExport}
          onImportClick={() => fileInputRef.current?.click()}
          onMenuClick={() => setIsSidebarOpen(true)} 
        />

        {/* Hidden Input File for Import */}
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept=".json" 
          className="hidden" 
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
};