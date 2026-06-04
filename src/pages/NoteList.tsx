import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { Search, Plus, Trash2, Calendar, Clock, ChevronLeft, ChevronRight, Edit3 } from 'lucide-react';
import { db } from '../db';

export const NoteList: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // ডাটাবেজ থেকে রিয়েল-টাইম লাইভ কুয়েরি
  const notes = useLiveQuery(() => db.caseNotes.orderBy('createdAt').reverse().toArray());

  // লোকাল ডাটাবেজ এক ক্লিকে সম্পূর্ণ ক্লিয়ার করার ফাংশন
  const handleClearDatabase = async () => {
    if (window.confirm("Are you sure you want to delete all dummy test notes from local database?")) {
      await db.caseNotes.clear();
      alert("Database cleaned successfully!");
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

  // সেফ ফিল্টারিং এবং ডামি ডেটা রিমুভাল লজিক
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
    <div className="space-y-6 max-w-[1600px] mx-auto p-2">
      
      {/* Header Container */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Case Notes</h2>
          <p className="text-xs font-medium text-slate-500 mt-0.5">Overview and auditing of active child welfare records.</p>
        </div>
        
        <div className="flex items-center gap-2.5 self-end sm:self-center">
          {/* Clear DB Button */}
          <button
            onClick={handleClearDatabase}
            className="flex items-center gap-2 border border-red-200/80 text-red-600 hover:text-red-700 bg-white hover:bg-red-50/60 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200 active:scale-95 shadow-2xs"
            title="Clear all local data"
          >
            <Trash2 size={14} className="opacity-90" />
            <span>Clear DB</span>
          </button>

          {/* Add Note Button */}
          <button
            onClick={() => navigate('/add-note')}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200 active:scale-95 shadow-md shadow-blue-600/10"
          >
            <Plus size={15} strokeWidth={2.5} />
            <span>Add Note</span>
          </button>
        </div>
      </div>

      {/* Main Table Wrapper Card */}
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
                setCurrentPage(1); // সার্চ করলে পেজিনেশন ১ এ রিসেট হবে
              }}
              className="w-full pl-9.5 pr-4 py-2 text-xs border border-slate-200 focus:border-blue-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 bg-white transition-all duration-200 text-slate-800 placeholder-slate-400/90 font-medium shadow-2xs"
            />
          </div>
          <div className="flex items-center gap-2 self-end sm:self-center">
            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100/50">
              Total Logs: {filteredNotes.length}
            </span>
          </div>
        </div>

        {/* Enterprise Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/40 border-b border-slate-100 text-slate-500 font-bold tracking-wider uppercase text-[10px]">
                <th className="p-4 pl-6">Date</th>
                <th className="p-4">Service Type</th>
                <th className="p-4">Duration</th>
                <th className="p-4">Case Name</th>
                <th className="p-4">Client Name</th>
                <th className="p-4 text-right pr-6">Action</th>
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
                    
                    {/* Date Column */}
                    <td className="p-4 pl-6 text-slate-900 font-semibold">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <Calendar size={13} className="text-slate-400" />
                        <span>{note.date || 'N/A'}</span>
                      </div>
                    </td>
                    
                    {/* Service Type Badge */}
                    <td className="p-4">
                      <span className="inline-flex items-center bg-slate-100/80 group-hover:bg-slate-200/50 text-slate-700 px-2.5 py-1 rounded-lg font-bold text-[10px] tracking-wide border border-slate-200/30 transition-colors">
                        {note.serviceType || 'N/A'}
                      </span>
                    </td>
                    
                    {/* Duration Log */}
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 font-semibold text-slate-600 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md w-max">
                        <Clock size={12} className="text-slate-400" />
                        <span>{note.durationMinutes ?? 0} Mins</span>
                      </div>
                    </td>
                    
                    {/* Case Identity */}
                    <td className="p-4 text-slate-900 font-bold tracking-tight text-sm">
                      {note.caseName || 'N/A'}
                    </td>
                    
                    {/* Client / Child Tag */}
                    <td className="p-4">
                      <div className="flex items-center gap-1.5">
                        <div className="w-6 h-6 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[10px] text-emerald-700 font-bold shrink-0">
                          {note.childName ? note.childName.charAt(0).toUpperCase() : 'C'}
                        </div>
                        <span className="text-slate-800 font-semibold">{note.childName || 'N/A'}</span>
                      </div>
                    </td>
                    
                    {/* Micro-Action Edit Button */}
                    <td className="p-4 text-right pr-6">
                      <button
                        onClick={() => navigate(`/edit-note/${note.id}`)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 hover:text-blue-600 rounded-xl text-xs font-semibold shadow-2xs transition-all duration-150 active:scale-95"
                      >
                        <Edit3 size={12} className="opacity-80" />
                        <span>Edit</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Clean Balanced Pagination Panel */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 bg-slate-50/40 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-slate-500 font-medium">
            <div className="font-semibold text-slate-400 order-2 sm:order-1">
              Showing <span className="text-slate-700">{indexOfFirstItem + 1}</span> to{' '}
              <span className="text-slate-700">{Math.min(indexOfLastItem, filteredNotes.length)}</span> of{' '}
              <span className="text-slate-700">{filteredNotes.length}</span> entries
            </div>
            
            <div className="flex items-center gap-1.5 order-1 sm:order-2">
              {/* Previous page button */}
              <button 
                disabled={currentPage === 1} 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
                className="p-1.5 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 transition-all disabled:opacity-40 disabled:hover:bg-white text-slate-600 cursor-pointer disabled:cursor-not-allowed active:scale-95 shadow-2xs"
              >
                <ChevronLeft size={14} />
              </button>

              {/* Page Number Loop */}
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

              {/* Next page button */}
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
    </div>
  );
};