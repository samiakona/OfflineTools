// pages/ThreatAssessmentPage.tsx (আপডেটেড)
import React, { useState, useEffect } from 'react';
import { 
  ClipboardList, Plus, Edit2, Trash2, 
  AlertTriangle, ShieldCheck, ShieldAlert, Calendar, Search, X,
  Zap, CloudLightning, WifiOff, CheckCircle2, Eye, Hash, Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { threatAssessmentService } from '../services/threatAssessmentService';
import { 
  checkThreatAPIHealth, 
  syncThreatAssessment, 
  syncMultipleThreatAssessments 
} from '../services/threatAssessmentApiForLive';
import type { ThreatAssessment } from '../types/ThreatAssessment';

export const ThreatAssessmentPage: React.FC = () => {
  const [assessments, setAssessments] = useState<ThreatAssessment[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isPushing, setIsPushing] = useState<boolean>(false);
  const [isPushingAll, setIsPushingAll] = useState<boolean>(false);
  const [pushingIds, setPushingIds] = useState<Set<number>>(new Set());
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [pushResults, setPushResults] = useState<Array<{ id: number; success: boolean; error?: string }>>([]);
  const navigate = useNavigate();

  const [modalType, setModalType] = useState<'offline' | 'delete' | 'clear_db' | 'push_success' | 'push_failed' | 'push_progress' | 'none'>('none');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedAssessment, setSelectedAssessment] = useState<ThreatAssessment | null>(null);

  const loadAssessments = async () => {
    setIsLoading(true);
    try {
      const data = await threatAssessmentService.getAllAssessments();
      setAssessments(data);
      
      const online = await checkThreatAPIHealth();
      setIsOnline(online);
    } catch (error) {
      console.error('Error loading assessments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAssessments();
    
    const interval = setInterval(async () => {
      const online = await checkThreatAPIHealth();
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
    setPushResults([]);
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
          await threatAssessmentService.hardDeleteAssessment(assessment.id);
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

  // 📤 একক রেকর্ড Push - LIVE API CALL
  const handlePushSingle = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const online = await checkThreatAPIHealth();
    if (!online) {
      setModalType('offline');
      return;
    }

    setPushingIds(prev => new Set(prev).add(id));

    try {
      const record = await threatAssessmentService.getAssessmentById(id);
      if (!record) {
        throw new Error('Record not found');
      }
      
      const caseNumber = record.caseNumber || `THREAT-${id}`;
      const result = await syncThreatAssessment(caseNumber, record);
      
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
      setPushingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  // 📤 সব রেকর্ড Push - LIVE API CALL
  const handlePushAll = async () => {
    const online = await checkThreatAPIHealth();
    if (!online) {
      setModalType('offline');
      return;
    }

    const records = await threatAssessmentService.getAllAssessments();
    if (records.length === 0) {
      alert('No assessments to push!');
      return;
    }

    setModalType('push_progress');
    setIsPushingAll(true);

    try {
      const assessmentsForApi = records.map(record => ({
        ...record,
        caseNumber: record.caseNumber || `THREAT-${record.id}`
      }));

      const result = await syncMultipleThreatAssessments(assessmentsForApi);
      
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

  // Push Progress Modal Content
  const renderPushProgress = () => (
    <div className="space-y-4 text-center">
      <div className="mx-auto w-11 h-11 bg-blue-50 rounded-full flex items-center justify-center border border-blue-100">
        <Loader2 size={20} className="text-blue-500 animate-spin" />
      </div>
      <div className="space-y-1">
        <h4 className="text-sm font-bold text-slate-900">Pushing to Server...</h4>
        <p className="text-xs text-slate-500 leading-relaxed">
          Please wait while the threat assessment data is being synced to the server.
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
              ? 'All threat assessments have been successfully synced to the server.'
              : `${successCount} out of ${totalCount} threat assessment records synced successfully.`
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
              ? 'Failed to push threat assessments to server. Please check your connection and try again.'
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
                handlePushSingle(selectedId, {} as React.MouseEvent);
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
          >
            {isPushingAll ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
            <span>{isPushingAll ? 'Pushing...' : 'All Data Push'}</span>
          </button>

          {/* Clear DB Button */}
          <button
            onClick={() => setModalType('clear_db')}
            className="flex items-center gap-1.5 border border-red-200/80 text-red-600 hover:text-red-700 bg-white hover:bg-red-50/60 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 active:scale-95 shadow-2xs cursor-pointer"
          >
            <Trash2 size={14} className="opacity-90" />
            <span>Clear DB</span>
          </button>

          {/* New Assessment Button */}
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
                  const isPushing = pushingIds.has(item.id || 0);
                  
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/40 transition-colors group">
                      
                      <td className="p-4 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 bg-slate-50 rounded-lg text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                            <Hash size={15} />
                          </div>
                          <div>
                            <span className="text-xs font-black text-slate-900 tracking-tight">
                              {item.caseNumber || ''}
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
                          
                          {/* Push Button */}
                          <button
                            type="button"
                            onClick={(e) => item.id && handlePushSingle(item.id, e)}
                            disabled={isPushing || isPushingAll}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-600 rounded-lg text-[11px] font-medium transition-all duration-150 active:scale-95 ${
                              (isPushing || isPushingAll) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                            }`}
                            title="Push data to server"
                          >
                            {(isPushing || isPushingAll) ? <Loader2 size={12} className="animate-spin" /> : <CloudLightning size={12} />}
                            <span>{(isPushing || isPushingAll) ? '...' : 'Push'}</span>
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

      {/* Modals */}
      {modalType === 'delete' && selectedAssessment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/40 transition-opacity duration-200" onClick={closeModal} />
          
          <div className="relative bg-white rounded-2xl shadow-xl max-w-sm w-full overflow-hidden transform transition-all p-6 text-center animate-in fade-in zoom-in-95 duration-150">
            <button onClick={closeModal} className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
              <X size={16} />
            </button>

            <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-3.5">
              <Trash2 size={22} className="text-rose-600" />
            </div>

            <h3 className="text-base font-extrabold text-slate-900 tracking-tight">Delete Assessment?</h3>
            <p className="text-xs text-slate-500 mt-1 px-2">
              Are you sure you want to permanently delete {selectedAssessment.caseNumber ? <>Case <span className="font-bold text-slate-700">#{selectedAssessment.caseNumber}</span></> : 'this record'}? This action cannot be undone.
            </p>

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
          <div className="fixed inset-0 bg-slate-900/50" onClick={closeModal} />
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

      {/* Push Progress Modal */}
      {modalType === 'push_progress' && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xl max-w-xs w-full p-5 space-y-4 relative animate-in fade-in zoom-in-95 duration-150">
            {renderPushProgress()}
          </div>
        </div>
      )}

      {/* Push Success Modal */}
      {modalType === 'push_success' && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xl max-w-xs w-full p-5 space-y-4 relative animate-in fade-in zoom-in-95 duration-150">
            {renderPushSuccess()}
          </div>
        </div>
      )}

      {/* Push Failed Modal */}
      {modalType === 'push_failed' && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xl max-w-xs w-full p-5 space-y-4 relative animate-in fade-in zoom-in-95 duration-150">
            {renderPushFailed()}
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
    </div>
  );
};