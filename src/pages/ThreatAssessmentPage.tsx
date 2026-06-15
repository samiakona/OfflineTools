import React, { useState, useEffect } from 'react';
import { 
  ClipboardList, Plus, Edit2, Trash2, 
  AlertTriangle, ShieldCheck, ShieldAlert, Calendar, Search, X,
  Zap, CloudLightning, WifiOff, CheckCircle2, Eye, Hash
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { threatAssessmentService } from '../services/threatAssessmentService';
import type { ThreatAssessment } from '../types/ThreatAssessment';

export const ThreatAssessmentPage: React.FC = () => {
  const [assessments, setAssessments] = useState<ThreatAssessment[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  const [modalType, setModalType] = useState<'offline' | 'delete' | 'clear_db' | 'push_success' | 'none'>('none');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedAssessment, setSelectedAssessment] = useState<ThreatAssessment | null>(null);
  const [syncStatus, setSyncStatus] = useState<{ syncing: boolean; lastSync: Date | null }>({
    syncing: false,
    lastSync: null
  });

  const loadAssessments = async () => {
    setIsLoading(true);
    try {
      const data = await threatAssessmentService.getAllAssessments();
      setAssessments(data);
    } catch (error) {
      console.error('Error loading assessments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAssessments();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal();
    };
    if (modalType !== 'none') window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modalType]);

  const handleEdit = (id: number) => {
    navigate(`/add-threat/${id}`);
  };

  const handleView = (id: number) => {
    navigate(`/add-threat/${id}`, { state: { mode: 'view' } });
  };

  const openDeleteModal = (id: number) => {
    const assessment = assessments.find(a => a.id === id);
    setSelectedId(id);
    setSelectedAssessment(assessment || null);
    setModalType('delete');
  };

  const closeModal = () => {
    setModalType('none');
    setSelectedId(null);
    setSelectedAssessment(null);
  };

  const confirmDelete = async () => {
    if (selectedId !== null) {
      try {
        await threatAssessmentService.deleteAssessment(selectedId);
        await loadAssessments();
        closeModal();
      } catch (error) {
        console.error('Error deleting assessment:', error);
      }
    }
  };

  const handleConfirmClearDatabase = async () => {
    setIsLoading(true);
    try {
      const allAssessments = await threatAssessmentService.getAllAssessments();
      for (const assessment of allAssessments) {
        if (assessment.id) {
          await threatAssessmentService.deleteAssessment(assessment.id);
        }
      }
      await loadAssessments();
      setModalType('none');
    } catch (error) {
      console.error('Error clearing database:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePushSingle = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const assessment = assessments.find(a => a.id === id);
    if (!assessment) return;

    setSyncStatus(prev => ({ ...prev, syncing: true }));
    await new Promise(resolve => setTimeout(resolve, 1500));
    console.log('Pushing assessment to server:', assessment);
    setModalType('push_success');
  };

  const handlePushAll = async () => {
    setSyncStatus(prev => ({ ...prev, syncing: true }));
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('Pushing all assessments to server:', assessments);
    setModalType('push_success');
  };

  const filteredAssessments = assessments.filter(item => {
    const query = searchQuery.toLowerCase();
    const matchesStarted = item.dateStarted?.toLowerCase().includes(query);
    const matchesThreshold = item.safetyThreshold?.toLowerCase().includes(query);
    const matchesStatus = item.isCompleted ? 'completed' : 'pending';
    const matchesCompleted = matchesStatus.includes(query);
    const matchesDateCompleted = item.dateCompleted ? item.dateCompleted.includes(query) : false;
    const matchesCaseNumber = item.caseNumber ? String(item.caseNumber).toLowerCase().includes(query) : false;
    return matchesStarted || matchesThreshold || matchesCompleted || matchesDateCompleted || matchesCaseNumber;
  });

  const formatDate = (dateString: string) => {
    if (!dateString) return null;
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  };

  const getThresholdStyles = (threshold: string) => {
    switch (threshold) {
      case 'Safe':
        return 'bg-emerald-50 border-emerald-200 text-emerald-700';
      case 'Conditionally Safe':
        return 'bg-amber-50 border-amber-200 text-amber-700';
      case 'Unsafe':
        return 'bg-orange-50 border-orange-200 text-orange-700';
      case 'Adult':
      case 'Behaviors':
        return 'bg-rose-50 border-rose-200 text-rose-700';
      default:
        return 'bg-slate-50 border-slate-200 text-slate-600';
    }
  };

  const getThresholdIcon = (threshold: string) => {
    switch (threshold) {
      case 'Safe':
        return <ShieldCheck size={12} />;
      case 'Conditionally Safe':
        return <AlertTriangle size={12} />;
      case 'Unsafe':
        return <ShieldAlert size={12} />;
      case 'Adult':
      case 'Behaviors':
        return <ShieldAlert size={12} />;
      default:
        return null;
    }
  };

  const totalAssessments = assessments.length;
  const completedCount = assessments.filter(a => a.isCompleted).length;
  const pendingCount = totalAssessments - completedCount;

  return (
    <div className="space-y-6 text-slate-800 pb-16 antialiased p-2 relative max-w-[1600px] mx-auto sm:p-4">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-200/80 pb-5 gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Threat Assessment Log</h2>
          <p className="text-xs font-medium text-slate-500 mt-0.5">
            Monitor safety thresholds, risk levels, and completion status for all threat assessments.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
          {syncStatus.lastSync && (
            <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-1 rounded-full">
              Last sync: {syncStatus.lastSync.toLocaleTimeString()}
            </span>
          )}
          
          <button
            onClick={handlePushAll}
            disabled={syncStatus.syncing || assessments.length === 0}
            className="flex items-center gap-1.5 bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 active:scale-95 shadow-2xs cursor-pointer disabled:opacity-50"
          >
            <Zap size={14} />
            <span>{syncStatus.syncing ? 'Syncing...' : 'All Data Push'}</span>
          </button>

          <button
            onClick={() => setModalType('clear_db')}
            className="flex items-center gap-1.5 border border-red-200/80 text-red-600 hover:text-red-700 bg-white hover:bg-red-50/60 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 active:scale-95 shadow-2xs cursor-pointer"
          >
            <Trash2 size={14} className="opacity-90" />
            <span>Clear DB</span>
          </button>

          <button 
            onClick={() => navigate('/add-threat')}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-blue-600/10 transition-all active:scale-95 cursor-pointer"
          >
            <Plus size={16} /> 
            <span>New Assessment</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-4 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">Total Assessments</p>
              <p className="text-2xl font-black text-blue-900 mt-1">{totalAssessments}</p>
            </div>
            <div className="bg-blue-200/50 p-3 rounded-lg">
              <ClipboardList size={24} className="text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-xl p-4 border border-emerald-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Completed</p>
              <p className="text-2xl font-black text-emerald-900 mt-1">{completedCount}</p>
            </div>
            <div className="bg-emerald-200/50 p-3 rounded-lg">
              <CheckCircle2 size={24} className="text-emerald-600" />
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-xl p-4 border border-amber-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">Pending</p>
              <p className="text-2xl font-black text-amber-900 mt-1">{pendingCount}</p>
            </div>
            <div className="bg-amber-200/50 p-3 rounded-lg">
              <AlertTriangle size={24} className="text-amber-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-center bg-slate-50/50 p-3 rounded-xl border border-slate-200/60">
        <div className="relative w-full sm:w-72">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <Search size={14} />
          </span>
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)} 
            placeholder="Filter by date, threshold, status, or case number..." 
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-blue-500 font-medium transition"
          />
        </div>
        <div className="text-[11px] font-bold text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-3xs">
          Total Records: <span className="text-blue-600 font-black">{filteredAssessments.length}</span>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80">
                <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Case Number</th>
                <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Date Started</th>
                <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">Safety Threshold</th>
                <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Date Completed</th>
                <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">Status</th>
                <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center w-72">Actions</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 text-xs font-medium">
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      Loading threat assessments...
                    </div>
                  </td>
                </tr>
              ) : filteredAssessments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 text-xs font-medium italic">
                    No threat assessments recorded.
                  </td>
                </tr>
              ) : (
                filteredAssessments.map((item) => {
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/40 transition-colors group">
                      
                      <td className="p-4 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 bg-slate-50 rounded-lg text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                            <Hash size={15} />
                          </div>
                          <div>
                            <span className="text-xs font-black text-slate-900 tracking-tight">
                              {item.caseNumber ? item.caseNumber : ``}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="p-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                          <Calendar size={13} className="text-slate-400" />
                          {formatDate(item.dateStarted)}
                        </div>
                      </td>

                      <td className="p-4 whitespace-nowrap text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${getThresholdStyles(item.safetyThreshold)}`}>
                          {getThresholdIcon(item.safetyThreshold)}
                          {item.safetyThreshold}
                        </span>
                      </td>

                      <td className="p-4 whitespace-nowrap">
                        {item.dateCompleted ? (
                          <div className="flex items-center gap-1.5">
                            <Calendar size={13} className="text-emerald-500" />
                            <span className="text-xs font-semibold text-emerald-700">
                              {formatDate(item.dateCompleted)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>

                      <td className="p-4 whitespace-nowrap text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold border ${
                          item.isCompleted 
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                            : 'bg-amber-50 border-amber-200 text-amber-700'
                        }`}>
                          {item.isCompleted ? <CheckCircle2 size={10} /> : <AlertTriangle size={10} />}
                          {item.isCompleted ? 'Completed' : 'Pending'}
                        </span>
                      </td>

                      {/* Action Buttons */}
                      <td className="p-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-2">
                          
                          <button
                            type="button"
                            onClick={(e) => handlePushSingle(item.id!, e)}
                            disabled={syncStatus.syncing}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-600 rounded-lg text-[11px] font-medium transition-all duration-150 active:scale-95 cursor-pointer disabled:opacity-50"
                            title="Push data to server"
                          >
                            <CloudLightning size={12} />
                            <span>Push</span>
                          </button>

                          {item.isCompleted ? (
                            <button 
                              type="button"
                              onClick={() => handleView(item.id!)} 
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-600 rounded-lg text-[11px] font-medium transition-all duration-150 active:scale-95 cursor-pointer"
                              title="View Assessment"
                            >
                              <Eye size={12} />
                              <span>View</span>
                            </button>
                          ) : (
                            <button 
                              type="button"
                              onClick={() => handleEdit(item.id!)} 
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-600 rounded-lg text-[11px] font-medium transition-all duration-150 active:scale-95 cursor-pointer"
                              title="Edit Assessment"
                            >
                              <Edit2 size={12} />
                              <span>Edit</span>
                            </button>
                          )}

                          <button 
                            type="button"
                            onClick={() => openDeleteModal(item.id!)} 
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 rounded-lg text-[11px] font-medium transition-all duration-150 active:scale-95 cursor-pointer"
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

      {/* --- CLEAN & CLEAN DELETE CONFIRMATION MODAL --- */}
      {modalType === 'delete' && selectedAssessment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/40  transition-opacity duration-200" onClick={closeModal} />
          
          <div className="relative bg-white rounded-2xl shadow-xl max-w-sm w-full overflow-hidden transform transition-all p-6 text-center animate-in fade-in zoom-in-95 duration-150">
            {/* Close Accent Cross */}
            <button onClick={closeModal} className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
              <X size={16} />
            </button>

            {/* Warning Trash Icon Center */}
            <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-3.5">
              <Trash2 size={22} className="text-rose-600" />
            </div>

            {/* Modal Heading & Description */}
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight">Delete Assessment?</h3>
            <p className="text-xs text-slate-500 mt-1 px-2">
              Are you sure you want to permanently delete {selectedAssessment.caseNumber ? <>Case <span className="font-bold text-slate-700">#{selectedAssessment.caseNumber}</span></> : 'this record'}? This action cannot be undone.
            </p>

            {/* Action Buttons Row */}
            <div className="flex items-center gap-2 mt-5">
              <button 
                type="button" 
                onClick={closeModal} 
                className="w-full py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition active:scale-98"
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={confirmDelete} 
                className="w-full py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-xs transition active:scale-98"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear Database Modal */}
      {modalType === 'clear_db' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/50 " onClick={closeModal} />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-red-50 to-white">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 size={16} className="text-red-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Clear Database</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Destructive action</p>
                </div>
              </div>
              <button onClick={closeModal} className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
                <X size={18} />
              </button>
            </div>
            <div className="px-6 py-5 text-center">
              <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={28} className="text-red-500" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-2">Clear Entire Database?</h4>
              <p className="text-sm text-slate-500 mb-4">This action will permanently delete all threat assessments from the database.</p>
              <div className="bg-red-50 border border-red-100 rounded-xl p-3">
                <p className="text-[11px] font-medium text-red-700">⚠️ This action cannot be undone. All data will be lost.</p>
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 bg-slate-50/50 border-t border-slate-100">
              <button onClick={closeModal} className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50">Cancel</button>
              <button onClick={handleConfirmClearDatabase} className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-red-600 to-red-700 rounded-xl hover:from-red-700 hover:to-red-800 shadow-md">Yes, Delete All</button>
            </div>
          </div>
        </div>
      )}

      {/* Push Success Modal */}
      {modalType === 'push_success' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/50 " onClick={closeModal} />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden transform transition-all duration-200">
            <div className="px-6 py-5 text-center">
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={32} className="text-emerald-500" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-2">Sync Successful!</h4>
              <p className="text-sm text-slate-500">Your secure threat assessment logs have been synced with the cloud repository.</p>
              <button onClick={closeModal} className="mt-5 w-full px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-xl shadow-md">Continue</button>
            </div>
          </div>
        </div>
      )}

      {/* Offline Push Alert Modal */}
      {modalType === 'offline' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden transform transition-all duration-200">
            <div className="px-6 py-5 text-center">
              <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <WifiOff size={32} className="text-amber-500" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-2">No Internet Connection</h4>
              <p className="text-sm text-slate-500 mb-4">Please connect to WiFi or mobile data to sync your data to the cloud.</p>
              <button onClick={closeModal} className="w-full px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-slate-700 to-slate-800 rounded-xl shadow-md">Got it</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};