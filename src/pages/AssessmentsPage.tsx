import React, { useState, useEffect } from 'react';
import { 
   Plus, Edit2, Trash2, 
  AlertTriangle, ShieldCheck, ShieldAlert, Calendar, Search, X,
  Zap, CloudLightning, WifiOff, CheckCircle2, Hash
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { assessmentService } from '../services/assessmentService'; 

import type { AssessmentRecord } from '../db/dexie'; 

export const AssessmentsPage: React.FC = () => {
  const navigate = useNavigate();
  
  const [assessments, setAssessments] = useState<AssessmentRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>(''); 
  const [isLoading, setIsLoading] = useState<boolean>(true); 

  // 📝 মোডাল স্টেটসমূহ
  const [modalType, setModalType] = useState<'offline' | 'delete' | 'clear_db' | 'push_success' | 'none'>('none');
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // 📥 ডেটাবেজ থেকে সব রেকর্ড লোড করার ফাংশন
  const loadAssessments = async () => {
    try {
      setIsLoading(true);
      const data = await assessmentService.getAllAssessments();
      setAssessments(data);
    } catch (error) {
      console.error("Failed to fetch assessments from IndexedDB:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAssessments();
  }, []);

  // Escape key দিয়ে মোডাল বন্ধ করা
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal();
    };
    if (modalType !== 'none') window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modalType]);

  const handleEdit = (id: number) => {
    navigate(`/edit-assessment/${id}`); 
  };

  const openDeleteModal = (id: number) => {
    setSelectedId(id);
    setModalType('delete');
  };

  const closeModal = () => {
    setModalType('none');
    setSelectedId(null);
  };

  // ❌ একক রেকর্ড ডিলিট কনফার্মেশন
  const confirmDelete = async () => {
    if (selectedId !== null) {
      try {
        await assessmentService.deleteAssessment(selectedId); 
        setAssessments(prev => prev.filter(item => item.id !== selectedId)); 
        closeModal();
      } catch (error) {
        console.error("Failed to delete record:", error);
      }
    }
  };

  // 🧹 সম্পূর্ণ ডাটাবেজ ক্লিয়ার করার ফাংশন
  const handleConfirmClearDatabase = async () => {
    try {
      setIsLoading(true);
      for (const item of assessments) {
        if (item.id) {
          await assessmentService.deleteAssessment(item.id);
        }
      }
      setAssessments([]);
      setModalType('none');
    } catch (error) {
      console.error("Failed to clear database:", error);
      setModalType('none');
    } finally {
      setIsLoading(false);
    }
  };

  // 🔍 সার্চ ফিল্টারিং লজিক (সবগুলো আলাদা ফিল্ড ট্র্যাক করবে)
  const filteredAssessments = assessments.filter(item => {
    const query = searchQuery.toLowerCase();
    
    const matchesCaseName = (item.caseName || '').toLowerCase().includes(query);
    const matchesName = (item.name || '').toLowerCase().includes(query);
    
    const typedItem = item as AssessmentRecord & { caseNumber?: string };
    const matchesCaseNumber = (typedItem.caseNumber || '').toLowerCase().includes(query);
    
    const childStatus = item.childIsSafe === 'Yes' ? 'safe' : 'at risk';
    const matchesStatus = childStatus.includes(query);

    return matchesCaseName || matchesName || matchesCaseNumber || matchesStatus;
  });

  // মোডালের ডিসপ্লে নামের জন্য সেফটি ফলব্যাক
  const targetAssessment = assessments.find(a => a.id === selectedId);
  const selectedCaseName = targetAssessment?.caseName || targetAssessment?.name || 'Unnamed Case';

  return (
    <div className="space-y-6 text-slate-800 pb-16 antialiased p-2 relative max-w-[1600px] mx-auto sm:p-4">
      
      {/* 🔝 Header Section */}   
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-200/80 pb-5 gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Assessments Log</h2>
          <p className="text-xs font-medium text-slate-500 mt-0.5">
            Monitor child safety parameters, home environmental evaluations, and completion timelines.
          </p>
        </div>

        {/* 🛠️ টপ অ্যাকশন বাটন সমূহ */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
          
          {/* All Data Push Button */}
          <button
            onClick={() => setModalType('push_success')}
            className="flex items-center gap-1.5 bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 active:scale-95 shadow-2xs cursor-pointer"
            title="Push all local data to server"
          >
            <Zap size={14} />
            <span>All Data Push</span>
          </button>

          {/* Clear DB Button */}
          <button
            onClick={() => setModalType('clear_db')}
            className="flex items-center gap-1.5 border border-red-200/80 text-red-600 hover:text-red-700 bg-white hover:bg-red-50/60 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 active:scale-95 shadow-2xs cursor-pointer"
            title="Clear all local data"
          >
            <Trash2 size={14} className="opacity-90" />
            <span>Clear DB</span>
          </button>

          {/* New Assessment Button */}
          <button 
            onClick={() => navigate('/new-assessment')}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-blue-600/10 transition-all active:scale-95 cursor-pointer"
          >
            <Plus size={16} /> 
            <span>New Assessment</span>
          </button>
        </div>
      </div>

      {/* 🔍 Search & Filter Bar Utilities */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-center bg-slate-50/50 p-3 rounded-xl border border-slate-200/60">
        <div className="relative w-full sm:w-72">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <Search size={14} />
          </span>
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)} 
            placeholder="Filter by name, case number or status..." 
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-blue-500 font-medium transition"
          />
        </div>
        <div className="text-[11px] font-bold text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-3xs">
          Total Records: <span className="text-blue-600 font-black">{filteredAssessments.length}</span>
        </div>
      </div>

      {/* 📊 Modern Datatable Container */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80">
              
                <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Case Number</th>
                <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Date Started</th>
                <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">Home Concerns</th>
                <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">Physical Status</th>
                <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">Child Is Safe</th>
                <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Date Completed</th>
                <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center w-48">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400 text-xs font-medium">
                    Loading assessments from offline database...
                  </td>
                </tr>
              ) : filteredAssessments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400 text-xs font-medium italic">
                    No assessments recorded in this block.
                  </td>
                </tr>
              ) : (
                filteredAssessments.map((item) => {
                  const typedItem = item as AssessmentRecord & { caseNumber?: string };
                  
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/40 transition-colors group">
                      
                    
                  

                      {/* 🔢 Case Number Field (আলাদা কলাম) */}
                      <td className="p-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold">
                          <Hash size={13} className="text-slate-400" />
                          <span>{typedItem.caseNumber || 'N/A'}</span>
                        </div>
                      </td>

                      {/* Date Started */}
                      <td className="p-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                          <Calendar size={13} className="text-slate-400" />
                          {item.dateStarted}
                        </div>
                      </td>

                      {/* Home Concerns Badge */}
                      <td className="p-4 whitespace-nowrap text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          item.hasHomeConcerns === 'Yes' ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-slate-50 border-slate-200 text-slate-600'
                        }`}>
                          {item.hasHomeConcerns === 'Yes' && <AlertTriangle size={11} />}
                          {item.hasHomeConcerns}
                        </span>
                      </td>

                      {/* Physical Status Concerns Badge */}
                      <td className="p-4 whitespace-nowrap text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          item.hasPhysicalConcerns === 'Yes' ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-slate-50 border-slate-200 text-slate-600'
                        }`}>
                          {item.hasPhysicalConcerns === 'Yes' && <AlertTriangle size={11} />}
                          {item.hasPhysicalConcerns}
                        </span>
                      </td>

                      {/* Child Is Safe Visual Status */}
                      <td className="p-4 whitespace-nowrap text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black tracking-wide uppercase border ${
                          item.childIsSafe === 'Yes' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-rose-100 border-rose-300 text-rose-800 animate-pulse'
                        }`}>
                          {item.childIsSafe === 'Yes' ? <ShieldCheck size={12} /> : <ShieldAlert size={12} />}
                          {item.childIsSafe === 'Yes' ? 'Safe' : 'At Risk'}
                        </span>
                      </td>

                      {/* Date Completed */}
                      <td className="p-4 whitespace-nowrap">
                        <span className={`text-xs font-semibold ${!item.dateCompleted || item.dateCompleted === 'Pending' ? 'text-amber-500 italic font-medium' : 'text-slate-600'}`}>
                          {item.dateCompleted || 'Pending'}
                        </span>
                      </td>

                      {/* 🛠️ টেবিলের ভেতরের অ্যাকশন বাটনসমূহ */}
                      <td className="p-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          
                          {/* Push Button */}
                          <button
                            type="button"
                            onClick={() => setModalType('offline')}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-50/60 hover:bg-blue-50 border border-blue-200 text-blue-600 rounded-xl text-[11px] font-bold shadow-2xs transition-all duration-150 active:scale-95 cursor-pointer"
                            title="Push data to server"
                          >
                            <CloudLightning size={12} className="opacity-90" />
                            <span>Push</span>
                          </button>

                          {/* Edit Button */}
                          <button 
                            type="button"
                            onClick={() => item.id && handleEdit(item.id)} 
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl border border-slate-200 bg-white transition shadow-3xs cursor-pointer text-[11px] font-bold"
                            title="Edit Assessment"
                          >
                            <Edit2 size={12} className="text-slate-400 group-hover:text-blue-500" />
                            <span>Edit</span>
                          </button>

                          {/* Remove Button */}
                          <button 
                            type="button"
                            onClick={() => item.id && openDeleteModal(item.id)} 
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl border border-rose-200 bg-white transition shadow-3xs cursor-pointer text-[11px] font-bold"
                            title="Delete Record"
                          >
                            <Trash2 size={12} />
                            <span>Remove</span>
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 🚨 ১. ডিলিট কনফার্মেশন মোডাল */}
      {modalType === 'delete' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity" onClick={closeModal} />
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 max-w-md w-full overflow-hidden z-10 transform transition-all scale-100 animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center px-5 py-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2 text-rose-600 font-extrabold text-xs uppercase tracking-wider">
                <AlertTriangle size={15} />
                <span>Confirm Destructive Action</span>
              </div>
              <button onClick={closeModal} className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer">
                <X size={15} strokeWidth={2.5} />
              </button>
            </div>
            <div className="p-6 space-y-3">
              <h3 className="text-base font-black text-slate-900 tracking-tight">Delete Assessment Record?</h3>
              <p className="text-xs font-medium text-slate-500 leading-relaxed">
                You are about to permanently purge the safety parameters log for: <br />
                <span className="inline-block mt-1.5 font-bold text-slate-800 bg-slate-100 border border-slate-200 px-2 py-1 rounded-md text-[11px]">
                  {selectedCaseName}
                </span>
              </p>
              <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 text-[10px] font-semibold text-rose-700 leading-normal">
                ⚠️ Warning: This action will permanently remove the record from your offline Dexie database storage.
              </div>
            </div>
            <div className="flex justify-end gap-2 px-5 py-3.5 bg-slate-50 border-t border-slate-100">
              <button type="button" onClick={closeModal} className="px-4 py-2 border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-3xs cursor-pointer">
                Cancel
              </button>
              <button type="button" onClick={confirmDelete} className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all active:scale-95 shadow-sm shadow-rose-600/10 cursor-pointer">
                Confirm Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🌐 ২. অফলাইন পুশ অ্যালার্ট মোডাল */}
      {modalType === 'offline' && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xl max-w-xs w-full p-5 space-y-4 text-center relative animate-in fade-in zoom-in-95 duration-150">
            <button onClick={closeModal} className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors cursor-pointer"><X size={15} /></button>
            <div className="mx-auto w-11 h-11 bg-red-50 rounded-full flex items-center justify-center border border-red-100">
              <WifiOff size={20} className="text-red-500" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-900">Connection Offline</h4>
              <p className="text-xs text-slate-500 leading-relaxed">Please connect your wifi or internet connection for push data.</p>
            </div>
            <button onClick={closeModal} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs py-2.5 rounded-xl transition-all active:scale-98 cursor-pointer">Okay, Got it</button>
          </div>
        </div>
      )}

      {/* 🧹 ৩. সম্পূর্ণ ডাটাবেজ ক্লিয়ার মোডাল */}
      {modalType === 'clear_db' && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xl max-w-xs w-full p-5 space-y-4 text-center relative animate-in fade-in zoom-in-95 duration-150">
            <div className="mx-auto w-11 h-11 bg-red-50 rounded-full flex items-center justify-center border border-red-100">
              <Trash2 size={20} className="text-red-500" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-900">Clear Entire Database?</h4>
              <p className="text-xs text-slate-500 leading-relaxed">Are you sure you want to delete all assessments from local database? This will completely wipe the logs.</p>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <button onClick={closeModal} className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs py-2.5 rounded-xl transition-all active:scale-98 cursor-pointer">Cancel</button>
              <button onClick={handleConfirmClearDatabase} className="w-1/2 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs py-2.5 rounded-xl transition-all active:scale-98 shadow-xs cursor-pointer">Yes, Wipe DB</button>
            </div>
          </div>
        </div>
      )}

      {/* 🎉 ৪. অল পুশ ডাটা সাকসেস মোডাল */}
      {modalType === 'push_success' && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xl max-w-xs w-full p-5 space-y-4 text-center relative animate-in fade-in zoom-in-95 duration-150">
            <button onClick={closeModal} className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors cursor-pointer"><X size={15} /></button>
            <div className="mx-auto w-11 h-11 bg-emerald-50 rounded-full flex items-center justify-center border border-emerald-100">
              <CheckCircle2 size={20} className="text-emerald-500" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-900">Sync Successful</h4>
              <p className="text-xs text-slate-500 leading-relaxed">Your secure assessment logs have been synced with the cloud repository.</p>
            </div>
            <button onClick={closeModal} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs py-2.5 rounded-xl transition-all active:scale-98 shadow-xs cursor-pointer">Awesome</button>
          </div>
        </div>
      )}

    </div>
  );
};