import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { Search, Plus, Trash2, Calendar, Clock, ChevronLeft, ChevronRight, Edit3, CloudLightning, Zap, WifiOff, X, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { db } from '../db';

export const NoteList: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // 📝 মোডাল স্টেটসমূহ
  const [modalType, setModalType] = useState<'offline' | 'delete' | 'clear_db' | 'push_success' | 'none'>('none');
  const [selectedNoteId, setSelectedNoteId] = useState<number | null>(null);

  // ডাটাবেজ থেকে রিয়েল-টাইম লাইভ কুয়েরি
  const notes = useLiveQuery(() => db.caseNotes.orderBy('createdAt').reverse().toArray());

  // কাস্টম মোডাল থেকে ডাটাবেজ সম্পূর্ণ ক্লিয়ার করার ফাংশন
  const handleConfirmClearDatabase = async () => {
    await db.caseNotes.clear();
    setModalType('none');
  };

  // সিঙ্গেল রিমুভ বাটনে ক্লিক করলে মোডাল দেখাবে (id চেক সহ)
  const triggerRemoveNote = (id: number | undefined) => {
    if (id !== undefined) {
      setSelectedNoteId(id);
      setModalType('delete');
    }
  };

  // কনফার্ম রিমুভ করার ফাংশন
  const handleConfirmRemove = async () => {
    if (selectedNoteId !== null) {
      await db.caseNotes.delete(selectedNoteId);
      setModalType('none');
      setSelectedNoteId(null);
    }
  };

  if (notes === undefined) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-500 font-medium space-y-3">
        <div className="w-8 h-8 border-3 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="text-sm tracking-wide">Loading secure local database...</p>
      </div>
    );
  }

  // ফিল্টারিং লজিক
  const filteredNotes = notes.filter(note => {
    if (!note.caseName || note.caseName.trim() === '' || note.caseName === 'N/A') return false;

    const caseName = note.caseName?.toLowerCase() || '';
    const childName = note.childName?.toLowerCase() || '';
    const serviceType = note.serviceType?.toLowerCase() || '';
    const search = searchTerm.toLowerCase();

    return caseName.includes(search) || childName.includes(search) || serviceType.includes(search);
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredNotes.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredNotes.length / itemsPerPage);

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto p-2 sm:p-4 relative">
      
      {/* Header Container */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Case Notes</h2>
          <p className="text-[11px] sm:text-xs font-medium text-slate-500 mt-0.5">Overview and auditing of active child welfare records.</p>
        </div>
        
        {/* Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
          
          {/* All Data Push Button */}
          <button
            onClick={() => setModalType('push_success')}
            className="flex items-center gap-1.5 sm:gap-2 bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white px-3 py-2 sm:px-3.5 rounded-xl text-xs font-semibold transition-all duration-200 active:scale-95 shadow-2xs cursor-pointer"
            title="Push all local data to server"
          >
            <Zap size={14} />
            <span>All Data Push</span>
          </button>

          {/* Clear DB Button */}
          <button
            onClick={() => setModalType('clear_db')}
            className="flex items-center gap-1.5 sm:gap-2 border border-red-200/80 text-red-600 hover:text-red-700 bg-white hover:bg-red-50/60 px-3 py-2 sm:px-3.5 rounded-xl text-xs font-semibold transition-all duration-200 active:scale-95 shadow-2xs cursor-pointer"
            title="Clear all local data"
          >
            <Trash2 size={14} className="opacity-90" />
            <span>Clear DB</span>
          </button>

          {/* Add Note Button */}
          <button
            onClick={() => navigate('/add-note')}
            className="flex items-center gap-1.5 sm:gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-3.5 py-2 sm:px-4.5 rounded-xl text-xs font-semibold transition-all duration-200 active:scale-95 shadow-md shadow-blue-600/10 cursor-pointer"
          >
            <Plus size={15} strokeWidth={2.5} />
            <span>Add Note</span>
          </button>
        </div>
      </div>

      {/* Main Container Card */}
      <div className="bg-white rounded-2xl border border-slate-200/70 shadow-xs overflow-hidden">
        
        {/* Search & Statistics Filter Bar */}
        <div className="p-4 bg-slate-50/60 flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-slate-100">
          <div className="relative w-full sm:w-80 group">
            <Search className="absolute left-3.5 top-2.5 text-slate-400 group-focus-within:text-blue-500 transition-colors duration-200" size={14} />
            <input
              type="text"
              placeholder="Search by client, case, or service..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9.5 pr-4 py-2 text-xs border border-slate-200 focus:border-blue-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 bg-white transition-all duration-200 text-slate-800 placeholder-slate-400/90 font-medium shadow-2xs"
            />
          </div>
          <div className="w-full sm:w-auto flex justify-end">
            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100/50">
              Total Logs: {filteredNotes.length}
            </span>
          </div>
        </div>

        {/* 📱 ১. মোবাইল কার্ড লেআউট */}
        <div className="block lg:hidden bg-slate-100/50 p-3 space-y-3.5">
          {currentItems.length === 0 ? (
            <div className="text-center py-12 text-slate-400 font-medium bg-white rounded-xl border border-slate-200/60">
              📁 No active welfare logs found.
            </div>
          ) : (
            currentItems.map((note) => (
              <div 
                key={note.id} 
                className="bg-white rounded-2xl border border-slate-200/70 shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden"
              >
                <div className="p-4 pb-3 border-b border-slate-100/80 flex justify-between items-center bg-slate-50/40">
                  <span className="inline-flex items-center bg-blue-50 text-blue-700 font-bold text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-lg border border-blue-100/60">
                    {note.serviceType || 'N/A'}
                  </span>
                  
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setModalType('offline')}
                      className="p-2 bg-blue-50/70 text-blue-600 hover:bg-blue-100 border border-blue-100 rounded-xl active:scale-90 transition-all cursor-pointer"
                      title="Push Data"
                    >
                      <CloudLightning size={13} />
                    </button>
                    <button
                      onClick={() => note.id !== undefined && navigate(`/edit-note/${note.id}`)}
                      className="p-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl active:scale-90 transition-all cursor-pointer"
                      title="Edit"
                    >
                      <Edit3 size={13} />
                    </button>
                    <button
                      onClick={() => triggerRemoveNote(note.id)}
                      className="p-2 bg-white hover:bg-red-50 border border-slate-200 hover:border-red-200 text-slate-400 hover:text-red-600 rounded-xl active:scale-90 transition-all cursor-pointer"
                      title="Remove"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                <div className="p-4 space-y-4">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Case Name</span>
                    <h3 className="text-base font-extrabold text-slate-900 tracking-tight leading-snug mt-0.5">
                      {note.caseName || 'N/A'}
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 p-2.5 rounded-xl">
                      <Calendar size={14} className="text-slate-400" />
                      <div className="flex flex-col">
                        <span className="text-[9px] font-bold text-slate-400 uppercase">Date</span>
                        <span className="text-xs font-bold text-slate-700">{note.date || 'N/A'}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 p-2.5 rounded-xl">
                      <Clock size={14} className="text-slate-400" />
                      <div className="flex flex-col">
                        <span className="text-[9px] font-bold text-slate-400 uppercase">Duration</span>
                        <span className="text-xs font-bold text-slate-700">{note.durationMinutes ?? 0} Mins</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[11px] text-emerald-700 font-extrabold shadow-2xs">
                        {note.childName ? note.childName.charAt(0).toUpperCase() : 'C'}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] font-bold text-slate-400 uppercase">Client</span>
                        <span className="text-xs text-slate-800 font-extrabold">{note.childName || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* 💻 ২. ডেক্সটপ টেবিল লেআউট */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/40 border-b border-slate-100 text-slate-500 font-bold tracking-wider uppercase text-[10px]">
                <th className="p-4 pl-6">Date</th>
                <th className="p-4">Service Type</th>
                <th className="p-4">Duration</th>
                <th className="p-4">Case Name</th>
                <th className="p-4">Client Name</th>
                <th className="p-4 text-center pr-6 w-56">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
              {currentItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-slate-400 font-medium">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <span className="text-xl">📁</span>
                      <p className="text-xs text-slate-400">No active welfare logs found matching search criteria.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                currentItems.map((note) => (
                  <tr key={note.id} className="hover:bg-slate-50/40 transition-colors duration-150 group">
                    <td className="p-4 pl-6 text-slate-900 font-semibold">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <Calendar size={13} className="text-slate-400" />
                        <span>{note.date || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center bg-slate-100/80 group-hover:bg-slate-200/50 text-slate-700 px-2.5 py-1 rounded-lg font-bold text-[10px] tracking-wide border border-slate-200/30 transition-colors">
                        {note.serviceType || 'N/A'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 font-semibold text-slate-600 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md w-max">
                        <Clock size={12} className="text-slate-400" />
                        <span>{note.durationMinutes ?? 0} Mins</span>
                      </div>
                    </td>
                    <td className="p-4 text-slate-900 font-bold tracking-tight text-sm">
                      {note.caseName || 'N/A'}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5">
                        <div className="w-6 h-6 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[10px] text-emerald-700 font-bold shrink-0">
                          {note.childName ? note.childName.charAt(0).toUpperCase() : 'C'}
                        </div>
                        <span className="text-slate-800 font-semibold">{note.childName || 'N/A'}</span>
                      </div>
                    </td>
                    
                    {/* Action Column */}
                    <td className="p-4 text-center pr-6">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setModalType('offline')}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-50/60 hover:bg-blue-50 border border-blue-200 text-blue-600 rounded-xl text-[11px] font-semibold shadow-2xs transition-all duration-150 active:scale-95 cursor-pointer"
                        >
                          <CloudLightning size={12} className="opacity-90" />
                          <span>Push</span>
                        </button>

                        <button
                          onClick={() => note.id !== undefined && navigate(`/edit-note/${note.id}`)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 hover:text-blue-600 rounded-xl text-[11px] font-semibold shadow-2xs transition-all duration-150 active:scale-95 cursor-pointer"
                        >
                          <Edit3 size={12} className="opacity-80" />
                          <span>Edit</span>
                        </button>
                        
                        <button
                          onClick={() => triggerRemoveNote(note.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-red-50 border border-slate-200 hover:border-red-200 text-slate-500 hover:text-red-600 rounded-xl text-[11px] font-semibold shadow-2xs transition-all duration-150 active:scale-95 cursor-pointer"
                        >
                          <Trash2 size={12} className="opacity-80" />
                          <span>Remove</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Panel */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 bg-slate-50/40 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-slate-500 font-medium">
            <div className="font-semibold text-slate-400 order-2 sm:order-1 text-center sm:text-left">
              Showing <span className="text-slate-700">{indexOfFirstItem + 1}</span> to{' '}
              <span className="text-slate-700">{Math.min(indexOfLastItem, filteredNotes.length)}</span> of{' '}
              <span className="text-slate-700">{filteredNotes.length}</span> entries
            </div>
            
            <div className="flex items-center gap-1.5 order-1 sm:order-2 flex-wrap justify-center">
              <button 
                disabled={currentPage === 1} 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
                className="p-1.5 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 transition-all disabled:opacity-40 disabled:hover:bg-white text-slate-600 cursor-pointer disabled:cursor-not-allowed active:scale-95 shadow-2xs"
              >
                <ChevronLeft size={14} />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`min-w-[28px] h-7 px-1.5 rounded-lg text-xs font-bold transition-all duration-150 active:scale-95 ${
                    currentPage === page 
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-2xs shadow-blue-600/10' 
                      : 'bg-white border border-slate-200 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  {page}
                </button>
              ))}

              <button 
                disabled={currentPage === totalPages} 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} 
                className="p-1.5 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 transition-all disabled:opacity-40 disabled:hover:bg-white text-slate-600 cursor-pointer disabled:cursor-not-allowed active:scale-95 shadow-2xs"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 🌐 CUSTOM SMALL MODALS */}
      
      {/* ১. অফলাইন মোডাল */}
      {modalType === 'offline' && (
        <div className="fixed inset-0 bg-slate-900/40  flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xl max-w-xs w-full p-5 space-y-4 text-center relative animate-in fade-in zoom-in-95 duration-150">
            <button onClick={() => setModalType('none')} className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors cursor-pointer"><X size={15} /></button>
            <div className="mx-auto w-11 h-11 bg-red-50 rounded-full flex items-center justify-center border border-red-100">
              <WifiOff size={20} className="text-red-500" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-900">Connection Offline</h4>
              <p className="text-xs text-slate-500 leading-relaxed">Please connect your wifi or internet connection for push data.</p>
            </div>
            <button onClick={() => setModalType('none')} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs py-2.5 rounded-xl transition-all active:scale-98 cursor-pointer">Okay, Got it</button>
          </div>
        </div>
      )}

      {/* ২. একক নোট রিমুভ নিশ্চিতকরণ মোডাল */}
      {modalType === 'delete' && (
        <div className="fixed inset-0 bg-slate-900/40  flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xl max-w-xs w-full p-5 space-y-4 text-center relative animate-in fade-in zoom-in-95 duration-150">
            <div className="mx-auto w-11 h-11 bg-amber-50 rounded-full flex items-center justify-center border border-amber-100">
              <AlertTriangle size={20} className="text-amber-500" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-900">Delete Case Note?</h4>
              <p className="text-xs text-slate-500 leading-relaxed">Are you sure you want to remove this log? This action cannot be undone.</p>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <button onClick={() => setModalType('none')} className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs py-2.5 rounded-xl transition-all active:scale-98 cursor-pointer">Cancel</button>
              <button onClick={handleConfirmRemove} className="w-1/2 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs py-2.5 rounded-xl transition-all active:scale-98 shadow-xs cursor-pointer">Yes, Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* ৩. সম্পূর্ণ ডাটাবেজ ক্লিয়ার নিশ্চিতকরণ মোডাল */}
      {modalType === 'clear_db' && (
        <div className="fixed inset-0 bg-slate-900/40  flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xl max-w-xs w-full p-5 space-y-4 text-center relative animate-in fade-in zoom-in-95 duration-150">
            <div className="mx-auto w-11 h-11 bg-red-50 rounded-full flex items-center justify-center border border-red-100">
              <Trash2 size={20} className="text-red-500" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-900">Clear Entire Database?</h4>
              <p className="text-xs text-slate-500 leading-relaxed">Are you sure you want to delete all dummy test notes from local database? This will completely wipe the logs.</p>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <button onClick={() => setModalType('none')} className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs py-2.5 rounded-xl transition-all active:scale-98 cursor-pointer">Cancel</button>
              <button onClick={handleConfirmClearDatabase} className="w-1/2 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs py-2.5 rounded-xl transition-all active:scale-98 shadow-xs cursor-pointer">Yes, Wipe DB</button>
            </div>
          </div>
        </div>
      )}

      {/* ৪. অল পুশ ডাটা সাকসেস মোডাল */}
      {modalType === 'push_success' && (
        <div className="fixed inset-0 bg-slate-900/40  flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xl max-w-xs w-full p-5 space-y-4 text-center relative animate-in fade-in zoom-in-95 duration-150">
            <button onClick={() => setModalType('none')} className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors cursor-pointer"><X size={15} /></button>
            <div className="mx-auto w-11 h-11 bg-emerald-50 rounded-full flex items-center justify-center border border-emerald-100">
              <CheckCircle2 size={20} className="text-emerald-500" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-900">Sync Successful</h4>
              <p className="text-xs text-slate-500 leading-relaxed">Your secure case welfare logs have been synced with the cloud repository.</p>
            </div>
            <button onClick={() => setModalType('none')} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs py-2.5 rounded-xl transition-all active:scale-98 shadow-xs cursor-pointer">Awesome</button>
          </div>
        </div>
      )}

    </div>
  );
};