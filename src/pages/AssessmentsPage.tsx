import React, { useState, useEffect } from 'react';
import { 
  Plus, Edit2, Trash2, 
  AlertTriangle, ShieldCheck, ShieldAlert, Calendar, Search, X,
  Zap, CloudLightning, WifiOff, CheckCircle2, Hash, Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { assessmentService } from '../services/assessmentService';
import { checkAssessmentAPIHealth, syncAssessment, syncMultipleAssessments } from '../services/assessmentApiForLive';
import type { AssessmentRecord } from '../hooks/dexie';

export const AssessmentsPage: React.FC = () => {
  const navigate = useNavigate();
  
  const [assessments, setAssessments] = useState<AssessmentRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>(''); 
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isPushingAll, setIsPushingAll] = useState<boolean>(false);
  const [pushingIds, setPushingIds] = useState<Set<number>>(new Set()); // 👈 প্রতি Row-এর জন্য আলাদা State
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [pushResults, setPushResults] = useState<Array<{ id: number; success: boolean; error?: string }>>([]);

  // 📝 মোডাল স্টেটসমূহ
  const [modalType, setModalType] = useState<'offline' | 'delete' | 'clear_db' | 'push_success' | 'push_failed' | 'push_progress' | 'none'>('none');
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // 📥 ডেটাবেজ থেকে সব রেকর্ড লোড করার ফাংশন
  const loadAssessments = async () => {
    try {
      setIsLoading(true);
      const data = await assessmentService.getAllAssessments();
      setAssessments(data);
      
      const online = await checkAssessmentAPIHealth();
      setIsOnline(online);
    } catch (error) {
      console.error("Failed to fetch assessments from IndexedDB:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAssessments();
    
    const interval = setInterval(async () => {
      const online = await checkAssessmentAPIHealth();
      setIsOnline(online);
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

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
    setPushResults([]);
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

  // 📤 একক রেকর্ড Push করার ফাংশন - প্রতি Row-এর জন্য আলাদা Loading
  const handlePushSingle = async (id: number) => {
    // Check connection first
    const online = await checkAssessmentAPIHealth();
    if (!online) {
      setModalType('offline');
      return;
    }

    // 👈 এই ID-টিকে Pushing List-এ যোগ করুন
    setPushingIds(prev => new Set(prev).add(id));

    try {
      const record = await assessmentService.getAssessmentById(id);
      if (!record) {
        throw new Error('Record not found');
      }
      
      const caseNumber = record.caseNumber || `ASSESSMENT-${id}`;
      const result = await syncAssessment(caseNumber, record);
      
      setPushResults([{ id, success: result.success, error: result.success ? undefined : result.message }]);
      
      if (result.success) {
        setModalType('push_success');
      } else {
        setModalType('push_failed');
      }
    } catch (error) {
      setPushResults([{ id, success: false, error: 'Failed to push' }]);
      setModalType('push_failed');
    } finally {
      // 👈 এই ID-টিকে Pushing List থেকে রিমুভ করুন
      setPushingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  // 📤 সব রেকর্ড Push করার ফাংশন
  const handlePushAll = async () => {
    const online = await checkAssessmentAPIHealth();
    if (!online) {
      setModalType('offline');
      return;
    }

    const records = await assessmentService.getAllAssessments();
    if (records.length === 0) {
      alert('No assessments to push!');
      return;
    }

    setModalType('push_progress');
    setIsPushingAll(true);

    try {
      const assessmentsForApi = records.map(record => ({
        ...record,
        caseNumber: record.caseNumber || `ASSESSMENT-${record.id}`
      }));

      const result = await syncMultipleAssessments(assessmentsForApi);
      
      const results = result.results.map((r, index) => ({
        id: records[index]?.id || 0,
        success: r.success,
        error: r.error
      }));
      
      setPushResults(results);
      
      if (result.success) {
        setModalType('push_success');
      } else {
        setModalType('push_failed');
      }
    } catch (error) {
      setModalType('push_failed');
    } finally {
      setIsPushingAll(false);
    }
  };

  // 🔍 সার্চ ফিল্টারিং লজিক
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

  const targetAssessment = assessments.find(a => a.id === selectedId);
  const selectedCaseName = targetAssessment?.caseName || targetAssessment?.name || 'Unnamed Case';

  // Push Progress Modal Content
  const renderPushProgress = () => (
    <div className="space-y-4 text-center">
      <div className="mx-auto w-11 h-11 bg-blue-50 rounded-full flex items-center justify-center border border-blue-100">
        <Loader2 size={20} className="text-blue-500 animate-spin" />
      </div>
      <div className="space-y-1">
        <h4 className="text-sm font-bold text-slate-900">Pushing to Server...</h4>
        <p className="text-xs text-slate-500 leading-relaxed">
          Please wait while the assessment data is being synced to the server.
        </p>
        <p className="text-[10px] text-slate-400">Check console for payload details</p>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
        <div className="bg-blue-600 h-full rounded-full animate-pulse w-full"></div>
      </div>
    </div>
  );

  // Push Success Modal Content
  const renderPushSuccess = () => {
    const successCount = pushResults.filter(r => r.success).length;
    const totalCount = pushResults.length;
    
    return (
      <div className="space-y-3">
        <div className="mx-auto w-11 h-11 bg-emerald-50 rounded-full flex items-center justify-center border border-emerald-100">
          <CheckCircle2 size={20} className="text-emerald-500" />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-slate-900">Sync Successful! 🎉</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            {totalCount === 0 
              ? 'All assessments have been successfully synced to the server.'
              : `${successCount} out of ${totalCount} assessment records synced successfully.`
            }
          </p>
          <p className="text-[10px] text-slate-400">
            📤 Check console for complete payload details
          </p>
        </div>
        {pushResults.length > 0 && (
          <div className="max-h-32 overflow-y-auto bg-slate-50 rounded-lg p-2 text-left border border-slate-200">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Sync Results:</p>
            {pushResults.map((result, idx) => (
              <div key={idx} className="text-[10px] font-medium flex items-center gap-2 py-1 border-b border-slate-100 last:border-0">
                <span className={result.success ? 'text-emerald-600' : 'text-red-500'}>
                  {result.success ? '✅' : '❌'}
                </span>
                <span className="text-slate-600">ID: {result.id}</span>
                {result.error && <span className="text-red-400 text-[9px]">{result.error}</span>}
              </div>
            ))}
          </div>
        )}
        <button onClick={closeModal} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs py-2.5 rounded-xl transition-all active:scale-98 shadow-xs cursor-pointer">
          Awesome! 👏
        </button>
      </div>
    );
  };

  // Push Failed Modal Content
  const renderPushFailed = () => {
    const failedCount = pushResults.filter(r => !r.success).length;
    
    return (
      <div className="space-y-3">
        <div className="mx-auto w-11 h-11 bg-red-50 rounded-full flex items-center justify-center border border-red-100">
          <AlertTriangle size={20} className="text-red-500" />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-slate-900">Push Failed! 😕</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            {pushResults.length === 0 
              ? 'Failed to push assessments to server. Please check your connection and try again.'
              : `${failedCount} out of ${pushResults.length} records failed to sync.`
            }
          </p>
        </div>
        {pushResults.some(r => r.error) && (
          <div className="bg-red-50 border border-red-100 rounded-lg p-2 text-left max-h-24 overflow-y-auto">
            <p className="text-[9px] font-bold text-red-400 uppercase tracking-wider mb-1">Errors:</p>
            {pushResults.filter(r => r.error).map((result, idx) => (
              <div key={idx} className="text-[10px] text-red-600 py-1 border-b border-red-100 last:border-0">
                ID: {result.id} - {result.error}
              </div>
            ))}
          </div>
        )}
        <div className="flex items-center gap-2 pt-1">
          <button onClick={closeModal} className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs py-2.5 rounded-xl transition-all active:scale-98 cursor-pointer">
            Close
          </button>
          <button 
            onClick={() => {
              if (selectedId) {
                handlePushSingle(selectedId);
              } else {
                handlePushAll();
              }
            }} 
            className="w-1/2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-2.5 rounded-xl transition-all active:scale-98 shadow-xs cursor-pointer"
          >
            Retry 🔄
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 text-slate-800 pb-16 antialiased p-2 relative max-w-[1600px] mx-auto sm:p-4">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-200/80 pb-5 gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Assessments Log</h2>
          <p className="text-xs font-medium text-slate-500 mt-0.5">
            Monitor child safety parameters, home environmental evaluations, and completion timelines.
          </p>
        </div>

        {/* Top Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
          
          {/* Connection Status */}
          <span className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold border ${
            isOnline ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
            {isOnline ? '🟢 Online' : '🔴 Offline'}
          </span>

          {/* All Data Push Button */}
          <button
            onClick={handlePushAll}
            disabled={isPushingAll}
            className={`flex items-center gap-1.5 bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 active:scale-95 shadow-2xs ${
              isPushingAll ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
            }`}
            title="Push all local data to server"
          >
            {isPushingAll ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
            <span>{isPushingAll ? 'Pushing...' : 'All Data Push'}</span>
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

      {/* Search & Filter Bar */}
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

      {/* Datatable */}
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
                  <td colSpan={7} className="p-8 text-center text-slate-400 text-xs font-medium">
                    Loading assessments from offline database...
                  </td>
                </tr>
              ) : filteredAssessments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 text-xs font-medium italic">
                    No assessments recorded in this block.
                  </td>
                </tr>
              ) : (
                filteredAssessments.map((item) => {
                  const typedItem = item as AssessmentRecord & { caseNumber?: string };
                  const isPushing = pushingIds.has(item.id || 0); // 👈 প্রতি Row-এর জন্য আলাদা Loading চেক
                  
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/40 transition-colors group">
                      <td className="p-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold">
                          <Hash size={13} className="text-slate-400" />
                          <span>{typedItem.caseNumber || 'N/A'}</span>
                        </div>
                      </td>

                      <td className="p-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                          <Calendar size={13} className="text-slate-400" />
                          {item.dateStarted}
                        </div>
                      </td>

                      <td className="p-4 whitespace-nowrap text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          item.hasHomeConcerns === 'Yes' ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-slate-50 border-slate-200 text-slate-600'
                        }`}>
                          {item.hasHomeConcerns === 'Yes' && <AlertTriangle size={11} />}
                          {item.hasHomeConcerns}
                        </span>
                      </td>

                      <td className="p-4 whitespace-nowrap text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          item.hasPhysicalConcerns === 'Yes' ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-slate-50 border-slate-200 text-slate-600'
                        }`}>
                          {item.hasPhysicalConcerns === 'Yes' && <AlertTriangle size={11} />}
                          {item.hasPhysicalConcerns}
                        </span>
                      </td>

                      <td className="p-4 whitespace-nowrap text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black tracking-wide uppercase border ${
                          item.childIsSafe === 'Yes' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-rose-100 border-rose-300 text-rose-800 animate-pulse'
                        }`}>
                          {item.childIsSafe === 'Yes' ? <ShieldCheck size={12} /> : <ShieldAlert size={12} />}
                          {item.childIsSafe === 'Yes' ? 'Safe' : 'At Risk'}
                        </span>
                      </td>

                      <td className="p-4 whitespace-nowrap">
                        <span className={`text-xs font-semibold ${!item.dateCompleted || item.dateCompleted === 'Pending' ? 'text-amber-500 italic font-medium' : 'text-slate-600'}`}>
                          {item.dateCompleted || 'Pending'}
                        </span>
                      </td>

                      <td className="p-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          
                          {/* Push Button - 🔥 প্রতি Row-এর জন্য আলাদা Loading */}
                          <button
                            type="button"
                            onClick={() => item.id && handlePushSingle(item.id)}
                            disabled={isPushing || isPushingAll}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-50/60 hover:bg-blue-50 border border-blue-200 text-blue-600 rounded-xl text-[11px] font-bold shadow-2xs transition-all duration-150 active:scale-95 ${
                              (isPushing || isPushingAll) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                            }`}
                            title="Push data to server"
                          >
                            {(isPushing || isPushingAll) ? <Loader2 size={12} className="animate-spin" /> : <CloudLightning size={12} className="opacity-90" />}
                            <span>{(isPushing || isPushingAll) ? '...' : 'Push'}</span>
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

      {/* Modals */}
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

      {modalType === 'push_progress' && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xl max-w-xs w-full p-5 space-y-4 relative animate-in fade-in zoom-in-95 duration-150">
            {renderPushProgress()}
          </div>
        </div>
      )}

      {modalType === 'push_success' && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xl max-w-xs w-full p-5 space-y-4 relative animate-in fade-in zoom-in-95 duration-150">
            {renderPushSuccess()}
          </div>
        </div>
      )}

      {modalType === 'push_failed' && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xl max-w-xs w-full p-5 space-y-4 relative animate-in fade-in zoom-in-95 duration-150">
            {renderPushFailed()}
          </div>
        </div>
      )}

    </div>
  );
};