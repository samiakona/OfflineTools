import React, { useState, useEffect } from 'react';
import { 
  ClipboardList, Plus, Edit2, Trash2, 
  AlertTriangle, ShieldCheck, ShieldAlert, Calendar, Search, X,
  Zap, CloudLightning, WifiOff, CheckCircle2, Eye
} from 'lucide-react';

// Dummy data interface
interface ThreatAssessment {
  id: number;
  caseName: string;
  dateStarted: string;
  safetyThreshold: 'Low' | 'Medium' | 'High' | 'Critical';
  dateCompleted: string | null;
  status: 'Pending' | 'Completed';
}

// Dummy data
const dummyAssessments: ThreatAssessment[] = [
  { id: 1, caseName: 'Case #2024-001', dateStarted: '2024-01-15', safetyThreshold: 'Low', dateCompleted: '2024-01-20', status: 'Completed' },
  { id: 2, caseName: 'Case #2024-002', dateStarted: '2024-01-18', safetyThreshold: 'High', dateCompleted: null, status: 'Pending' },
  { id: 3, caseName: 'Case #2024-003', dateStarted: '2024-01-20', safetyThreshold: 'Medium', dateCompleted: '2024-01-25', status: 'Completed' },
  { id: 4, caseName: 'Case #2024-004', dateStarted: '2024-01-22', safetyThreshold: 'Critical', dateCompleted: null, status: 'Pending' },
  { id: 5, caseName: 'Case #2024-005', dateStarted: '2024-01-25', safetyThreshold: 'Low', dateCompleted: null, status: 'Pending' },
  { id: 6, caseName: 'Case #2024-006', dateStarted: '2024-01-28', safetyThreshold: 'High', dateCompleted: '2024-02-01', status: 'Completed' },
  { id: 7, caseName: 'Case #2024-007', dateStarted: '2024-02-01', safetyThreshold: 'Medium', dateCompleted: null, status: 'Pending' },
];

const ThreatAssessmentPage: React.FC = () => {
  const [assessments, setAssessments] = useState<ThreatAssessment[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modal states
  const [modalType, setModalType] = useState<'offline' | 'delete' | 'clear_db' | 'push_success' | 'none'>('none');
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // Load dummy data
  const loadAssessments = async () => {
    setIsLoading(true);
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    setAssessments(dummyAssessments);
    setIsLoading(false);
  };

  useEffect(() => {
    loadAssessments();
  }, []);

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal();
    };
    if (modalType !== 'none') window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modalType]);

  const handleEdit = (id: number) => {
    console.log('Edit assessment:', id);
    // navigate(`/edit-threat-assessment/${id}`);
  };

  const handleView = (id: number) => {
    console.log('View assessment:', id);
    // navigate(`/view-threat-assessment/${id}`);
  };

  const openDeleteModal = (id: number) => {
    setSelectedId(id);
    setModalType('delete');
  };

  const closeModal = () => {
    setModalType('none');
    setSelectedId(null);
  };

  // Delete record
  const confirmDelete = async () => {
    if (selectedId !== null) {
      setAssessments(prev => prev.filter(item => item.id !== selectedId));
      closeModal();
    }
  };

  // Clear all data
  const handleConfirmClearDatabase = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 300));
    setAssessments([]);
    setModalType('none');
    setIsLoading(false);
  };

  // Search filter logic
  const filteredAssessments = assessments.filter(item => {
    const query = searchQuery.toLowerCase();
    const matchesCase = item.caseName.toLowerCase().includes(query);
    const matchesThreshold = item.safetyThreshold.toLowerCase().includes(query);
    const matchesStatus = item.status.toLowerCase().includes(query);
    return matchesCase || matchesThreshold || matchesStatus;
  });

  // Get safety threshold badge styles
  const getThresholdStyles = (threshold: ThreatAssessment['safetyThreshold']) => {
    switch (threshold) {
      case 'Low':
        return 'bg-emerald-50 border-emerald-200 text-emerald-700';
      case 'Medium':
        return 'bg-amber-50 border-amber-200 text-amber-700';
      case 'High':
        return 'bg-orange-50 border-orange-200 text-orange-700';
      case 'Critical':
        return 'bg-rose-50 border-rose-200 text-rose-700 animate-pulse';
      default:
        return 'bg-slate-50 border-slate-200 text-slate-600';
    }
  };

  const getThresholdIcon = (threshold: ThreatAssessment['safetyThreshold']) => {
    switch (threshold) {
      case 'Low':
        return <ShieldCheck size={12} />;
      case 'Medium':
        return <AlertTriangle size={12} />;
      case 'High':
        return <ShieldAlert size={12} />;
      case 'Critical':
        return <ShieldAlert size={12} />;
      default:
        return null;
    }
  };

  const targetAssessment = assessments.find(a => a.id === selectedId);
  const selectedCaseName = targetAssessment?.caseName || 'Unnamed Case';

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

        {/* Top Action Buttons */}
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
            onClick={() => console.log('New threat assessment')}
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
            placeholder="Filter by case, threshold, or status..." 
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-blue-500 font-medium transition"
          />
        </div>
        <div className="text-[11px] font-bold text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-3xs">
          Total Records: <span className="text-blue-600 font-black">{filteredAssessments.length}</span>
        </div>
      </div>

      {/* Data Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80">
                <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Case / Identifier</th>
                <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Date Started</th>
                <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">Safety Threshold</th>
                <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Date Completed</th>
                <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center w-56">Actions</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400 text-xs font-medium">
                    Loading threat assessments...
                  </td>
                </tr>
              ) : filteredAssessments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400 text-xs font-medium italic">
                    No threat assessments recorded.
                  </td>
                </tr>
              ) : (
                filteredAssessments.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/40 transition-colors group">
                    
                    {/* Case Name / Identifier */}
                    <td className="p-4 whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-slate-50 rounded-lg text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                          <ClipboardList size={15} />
                        </div>
                        <span className="text-xs font-bold text-slate-900">
                          {item.caseName}
                        </span>
                      </div>
                    </td>

                    {/* Date Started */}
                    <td className="p-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                        <Calendar size={13} className="text-slate-400" />
                        {item.dateStarted}
                      </div>
                    </td>

                    {/* Safety Threshold Badge */}
                    <td className="p-4 whitespace-nowrap text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${getThresholdStyles(item.safetyThreshold)}`}>
                        {getThresholdIcon(item.safetyThreshold)}
                        {item.safetyThreshold}
                      </span>
                    </td>

                    {/* Date Completed */}
                    <td className="p-4 whitespace-nowrap">
                      <span className={`text-xs font-semibold ${!item.dateCompleted || item.status === 'Pending' ? 'text-amber-500 italic font-medium' : 'text-slate-600'}`}>
                        {item.dateCompleted || 'Pending'}
                      </span>
                    </td>

                    {/* Action Buttons */}
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

                        {/* View Button */}
                        <button 
                          type="button"
                          onClick={() => handleView(item.id)} 
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl border border-slate-200 bg-white transition shadow-3xs cursor-pointer text-[11px] font-bold"
                          title="View Assessment"
                        >
                          <Eye size={12} className="text-slate-400 group-hover:text-emerald-500" />
                          <span>View</span>
                        </button>

                        {/* Edit Button */}
                        <button 
                          type="button"
                          onClick={() => handleEdit(item.id)} 
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl border border-slate-200 bg-white transition shadow-3xs cursor-pointer text-[11px] font-bold"
                          title="Edit Assessment"
                        >
                          <Edit2 size={12} className="text-slate-400 group-hover:text-blue-500" />
                          <span>Edit</span>
                        </button>

                        {/* Remove Button */}
                        <button 
                          type="button"
                          onClick={() => openDeleteModal(item.id)} 
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl border border-rose-200 bg-white transition shadow-3xs cursor-pointer text-[11px] font-bold"
                          title="Delete Record"
                        >
                          <Trash2 size={12} />
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
      </div>

      {/* Delete Confirmation Modal */}
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
              <h3 className="text-base font-black text-slate-900 tracking-tight">Delete Threat Assessment?</h3>
              <p className="text-xs font-medium text-slate-500 leading-relaxed">
                You are about to permanently delete the threat assessment for: <br />
                <span className="inline-block mt-1.5 font-bold text-slate-800 bg-slate-100 border border-slate-200 px-2 py-1 rounded-md text-[11px]">
                  {selectedCaseName}
                </span>
              </p>
              <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 text-[10px] font-semibold text-rose-700 leading-normal">
                ⚠️ Warning: This action will permanently remove the record from your database.
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

      {/* Offline Push Alert Modal */}
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

      {/* Clear Database Modal */}
      {modalType === 'clear_db' && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xl max-w-xs w-full p-5 space-y-4 text-center relative animate-in fade-in zoom-in-95 duration-150">
            <div className="mx-auto w-11 h-11 bg-red-50 rounded-full flex items-center justify-center border border-red-100">
              <Trash2 size={20} className="text-red-500" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-900">Clear Entire Database?</h4>
              <p className="text-xs text-slate-500 leading-relaxed">Are you sure you want to delete all threat assessments from the database? This will completely wipe the logs.</p>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <button onClick={closeModal} className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs py-2.5 rounded-xl transition-all active:scale-98 cursor-pointer">Cancel</button>
              <button onClick={handleConfirmClearDatabase} className="w-1/2 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs py-2.5 rounded-xl transition-all active:scale-98 shadow-xs cursor-pointer">Yes, Wipe DB</button>
            </div>
          </div>
        </div>
      )}

      {/* Push Success Modal */}
      {modalType === 'push_success' && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xl max-w-xs w-full p-5 space-y-4 text-center relative animate-in fade-in zoom-in-95 duration-150">
            <button onClick={closeModal} className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors cursor-pointer"><X size={15} /></button>
            <div className="mx-auto w-11 h-11 bg-emerald-50 rounded-full flex items-center justify-center border border-emerald-100">
              <CheckCircle2 size={20} className="text-emerald-500" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-900">Sync Successful</h4>
              <p className="text-xs text-slate-500 leading-relaxed">Your secure threat assessment logs have been synced with the cloud repository.</p>
            </div>
            <button onClick={closeModal} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs py-2.5 rounded-xl transition-all active:scale-98 shadow-xs cursor-pointer">Awesome</button>
          </div>
        </div>
      )}

    </div>
  );
};

export default ThreatAssessmentPage;