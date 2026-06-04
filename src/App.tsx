import React, { useRef } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';

// ডাটাবেজ ইম্পোর্ট (আপনার সঠিক পাথ অনুযায়ী চেক করে নিতে পারেন)
import { db } from './db'; 

// পেজ ইম্পোর্টস
import { NoteList } from './pages/NoteList';
import { NoteFormPage } from './pages/NoteFormPage';
import { Sidebar } from './components/Layout/Sidebar';
import { Topbar } from './components/Layout/Topbar';
import { Footer } from './components/Layout/Footer';

// একটি সাহায্যকারী কম্পোনেন্ট যাতে টপবারের সাথে রাউটার নেভিগেশন সহজে করা যায়
const DashboardLayout: React.FC = () => {
  const navigate = useNavigate();
  
  // ফাইল ইনপুটের জন্য একটি রিফ (Ref)
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 📤 প্যাকেজ ছাড়া ডাটাবেজ এক্সপোর্ট করার লজিক
  const handleExport = async () => {
    try {
      // ১. ডাটাবেজ থেকে সব কেস নোট তুলে আনা
      const allNotes = await db.caseNotes.toArray();

      // ২. ব্যাকআপ ডেটার একটি অবজেক্ট তৈরি
      const backupData = {
        databaseName: db.name,
        version: db.verno,
        exportedAt: new Date().toISOString(),
        data: allNotes
      };

      // ৩. JSON অবজেক্টকে ফাইলে রূপান্তর
      const jsonString = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });

      // ৪. ব্রাউজারে ফাইল ডাউনলোড ট্রিগার করা
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

  // 📥 প্যাকেজ ছাড়া ডাটাবেজ ইমপোর্ট করার লজিক
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (window.confirm("Importing this file will overwrite your local data. Do you want to proceed?")) {
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        try {
          const jsonText = event.target?.result as string;
          const parsedBackup = JSON.parse(jsonText);

          // ফাইল ভ্যালিডেশন চেক
          if (!parsedBackup || !Array.isArray(parsedBackup.data)) {
            throw new Error("Invalid backup file structure.");
          }

          // ১. বর্তমান ডাটাবেজ ক্লিয়ার করা
          await db.caseNotes.clear();

          // ২. নতুন ফাইল থেকে পাওয়া ডেটা একবারে ডাটাবেজে ইনসার্ট করা
          if (parsedBackup.data.length > 0) {
            await db.caseNotes.bulkAdd(parsedBackup.data);
          }

          alert("Database imported successfully!");
          window.location.reload(); // নতুন ডেটা স্ক্রিনে দেখানোর জন্য রিলোড

        } catch (error) {
          console.error("Import failed:", error);
          alert("Error importing file! Make sure it is a valid JSON backup.");
        }
      };

      reader.readAsText(file);
    }
    
    // ইনপুট ভ্যালু রিসেট করা যাতে একই ফাইল পরপর ইম্পোর্ট করা যায়
    e.target.value = '';
  };

  // ইম্পোর্ট বাটনে ক্লিক করলে হিডেন ফাইল ইনপুট ওপেন করার ট্রিক
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden text-slate-900 font-sans">
      {/* ১. স্টিকি সাইডবার */}
      <Sidebar />

      {/* ডানদিকের মেইন কন্টেইনার */}
      <div className="flex flex-col flex-1 h-full overflow-hidden">
        
        {/* ২. স্টিকি টপবার (ফাংশনগুলো এখানে কানেক্ট করে দেওয়া হয়েছে) */}
        <Topbar
          onExportClick={handleExport}
          onImportClick={handleImportClick}
        />

        {/* স্ক্রিনে দেখা যাবে না এমন একটি হিডেন ফাইল ইনপুট */}
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept=".json" 
          className="hidden" 
        />

        {/* ৩. স্ক্রোলযোগ্য মেইন কন্টেন্ট এরিয়া */}
        <main className="flex-1 overflow-y-auto p-6">
          <Routes>
            <Route path="/" element={<NoteList />} />
            <Route path="/add-note" element={<NoteFormPage />} />
            <Route path="/edit-note/:id" element={<NoteFormPage />} />
          </Routes>
        </main>

        {/* ৪. স্টিকি ফুটার */}
        <Footer />
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <DashboardLayout />
    </BrowserRouter>
  );
};

export default App;