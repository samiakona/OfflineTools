import React, { useRef, useState } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';

// ডাটাবেজ ইম্পোর্ট
import { db } from './db'; 

// পেজ ইম্পোর্টস
import { NoteList } from './pages/NoteList';
import { NoteFormPage } from './pages/NoteFormPage';
import { Sidebar } from './components/Layout/Sidebar';
import { Topbar } from './components/Layout/Topbar';
import { Footer } from './components/Layout/Footer';

const DashboardLayout: React.FC = () => {
  // ফাইল ইনপুটের জন্য রিফ
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // মোবাইল এবং ট্যাবলেটে সাইডবার ওপেন/ক্লোজ করার স্টেট
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // 📤 এক্সপোর্ট লজিক
  const handleExport = async () => {
    try {
      const allNotes = await db.caseNotes.toArray();
      const backupData = {
        databaseName: db.name,
        version: db.verno,
        exportedAt: new Date().toISOString(),
        data: allNotes
      };

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

  // 📥 ইম্পোর্ট লজিক
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (window.confirm("Importing this file will overwrite your local data. Do you want to proceed?")) {
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        try {
          const jsonText = event.target?.result as string;
          const parsedBackup = JSON.parse(jsonText);

          if (!parsedBackup || !Array.isArray(parsedBackup.data)) {
            throw new Error("Invalid backup file structure.");
          }

          await db.caseNotes.clear();
          if (parsedBackup.data.length > 0) {
            await db.caseNotes.bulkAdd(parsedBackup.data);
          }

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

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex h-screen w-screen bg-slate-50 overflow-hidden text-slate-900 font-sans relative">
      
      {/* ১. রেসপন্সিভ সাইডবার কন্টেইনার */}
      {/* বড় স্ক্রিনে (lg:) এটি ফিক্সড থাকবে, ছোট স্ক্রিনে ড্রয়ার হিসেবে কাজ করবে */}
      <div className={`
        fixed inset-y-0 left-0 z-50 transform bg-white shadow-xl transition-transform duration-300 ease-in-out
        lg:relative lg:translate-x-0 lg:shadow-none
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* এখানে আপনার Sidebar কম্পোনেন্ট। ক্লোজ করার জন্য একটি প্রপ্স পাস করতে পারেন যদি প্রয়োজন হয় */}
        <Sidebar />
      </div>

      {/* মোবাইল/ট্যাবলেটে সাইডবার ওপেন থাকলে ব্যাকগ্রাউন্ড আবছা (Overlay) করার জন্য */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* ডানদিকের মেইন কন্টেইনার */}
      <div className="flex flex-col flex-1 h-full min-w-0 overflow-hidden">
        
        {/* ২. টপবার (মোবাইল মেনু বাটনসহ) */}
        {/* Topbar কম্পোনেন্টের ভেতর একটি Hamburger বাটন রাখুন এবং অন-ক্লিক-এ `onMenuClick` কল করুন */}
        <Topbar
          onExportClick={handleExport}
          onImportClick={handleImportClick}
          onMenuClick={() => setIsSidebarOpen(true)} 
        />

        {/* হিডেন ফাইল ইনপুট */}
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept=".json" 
          className="hidden" 
        />

        {/* ৩. স্ক্রোলযোগ্য মেইন কন্টেন্ট এরিয়া (প্যাডিং রেসপন্সিভ করা হয়েছে) */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
          <div className="max-w-7xl mx-auto w-full">
            <Routes>
              <Route path="/" element={<NoteList />} />
              <Route path="/add-note" element={<NoteFormPage />} />
              <Route path="/edit-note/:id" element={<NoteFormPage />} />
            </Routes>
          </div>
        </main>

        {/* ৪. ফুটার */}
        <Footer />
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <DashboardLayout />
    </HashRouter>
  );
};

export default App;