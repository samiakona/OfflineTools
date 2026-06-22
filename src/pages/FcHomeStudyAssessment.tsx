import React, { useState, useEffect } from 'react';
import { Calendar, Clock, ShieldCheck, Check, Save, X, FileText, List, Plus, Edit2, Eye, Trash2, CloudLightning, ChevronDown, Hash, User, RefreshCw, Loader2, AlertTriangle, CheckCircle2, Users, UserRound } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import type { HomeStudyAssessmentData } from '../types/homeStudy';
import { homeStudyService } from '../services/homeStudyService';
import { 
  checkHomeStudyAPIHealth, 
  syncHomeStudy, 
  syncMultipleHomeStudies 
} from '../services/homeStudyApiForLive';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';

const TIME_OPTIONS = (() => {
  const times = [];
  for (let i = 0; i < 24; i++) {
    for (const min of [0, 30]) {
      const hour = i % 12 || 12;
      const ampm = i < 12 ? 'AM' : 'PM';
      const minuteStr = min.toString().padStart(2, '0');
      times.push({ value: `${hour}:${minuteStr} ${ampm}`, label: `${hour}:${minuteStr} ${ampm}` });
    }
  }
  return times;
})();

const INITIAL_FORM_STATE: HomeStudyAssessmentData = {
  assessmentDate: new Date().toISOString().split('T')[0],
  assessmentTime: '10:00 AM',
  familyName: '',
  caregiverFirstName: '',
  caregiverLastName: '',
  caregiverName: '',
  contacts: '',
  sourceOfReferral: '',
  directionsToHome: '',
  motivationForTakingChild: '',
  bornAndRaised: '',
  parentsDetails: '',
  siblingsDetails: '',
  siblingsRelationship: '',
  howRaised: '',
  conflictResolution: '',
  familyActivities: '',
  selfDescription: '',
  strengthsWeaknesses: '',
  dealWithStress: '',
  thingsUpsetYou: '',
  highSchool: '',
  importanceOfEducation: '',
  newParentingSkills: '',
  currentOccupation: '',
  careerPlans: '',
  workExperiencePrep: '',
  describeChildren: '',
  treatFosterChild: '',
  parentWellThings: '',
  parentImproveThings: '',
  parentUpsetThings: '',
  experiencesInsideHome: '',
  familyRules: '',
  disciplineOwnChildren: '',
  physicalDisciplineThoughts: '',
  chemicalUseDescription: '',
  acceptableAlcoholUse: '',
  familyChemicalProblem: '',
  spiritualityCultureRole: '',
  childBeliefsDiffer: '',
  childPersonalBeliefsDiffer: '',
  moneyHandled: '',
  financialPicture: '',
  isCompleted: false,
  caregiverId: ''
};

// --- Sub-components ---
const FormSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/70 shadow-2xs space-y-4">
    <div className="text-blue-700 font-extrabold text-sm tracking-wider uppercase border-b border-slate-100 pb-2 mb-2">
      {title}
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">{children}</div>
  </div>
);

interface FormTextAreaProps {
  label: string;
  field: keyof HomeStudyAssessmentData;
  formData: HomeStudyAssessmentData;
  isReadOnly: boolean;
  updateField: (name: keyof HomeStudyAssessmentData, value: any) => void;
}

const FormTextArea: React.FC<FormTextAreaProps> = ({ label, field, formData, isReadOnly, updateField }) => (
  <div className="flex flex-col space-y-1.5">
    <label className="text-xs font-bold text-slate-700">{label}</label>
    <textarea
      value={(formData[field] as string) || ''}
      onChange={(e) => updateField(field, e.target.value)}
      disabled={isReadOnly}
      rows={3}
      className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 resize-none text-sm bg-white text-slate-800 placeholder-slate-400 font-medium transition disabled:bg-slate-50 disabled:text-slate-400"
      placeholder={isReadOnly ? "No response recorded" : "Type response here..."}
    />
  </div>
);

// ============================================
// 🎉 PUSH SUCCESS MODAL COMPONENT
// ============================================
interface PushSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  details?: string;
  syncedId?: number;
  caseNumber?: string;
  isBulk?: boolean;
  totalSynced?: number;
  totalRecords?: number;
  failedCount?: number;
}

const PushSuccessModal: React.FC<PushSuccessModalProps> = ({
  isOpen,
  onClose,
  title,
  message,
  details,
  syncedId,
  caseNumber,
  isBulk = false,
  totalSynced = 0,
  totalRecords = 0,
  failedCount = 0
}) => {
  if (!isOpen) return null;

  const hasErrors = failedCount && failedCount > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all scale-100 animate-in zoom-in-95 duration-150">
        <div className={`px-6 py-4 ${hasErrors ? 'bg-gradient-to-r from-amber-50 to-white border-b border-amber-200' : 'bg-gradient-to-r from-emerald-50 to-white border-b border-emerald-200'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${hasErrors ? 'bg-amber-100' : 'bg-emerald-100'}`}>
              {hasErrors ? (
                <AlertTriangle size={20} className="text-amber-600" />
              ) : (
                <CheckCircle2 size={20} className="text-emerald-600" />
              )}
            </div>
            <div>
              <h3 className={`text-base font-bold ${hasErrors ? 'text-amber-800' : 'text-emerald-800'}`}>
                {hasErrors ? '⚠️ Partial Sync' : '🎉 Sync Successful!'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">{title}</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="text-center">
            <div className={`mx-auto w-14 h-14 rounded-full flex items-center justify-center mb-3 ${hasErrors ? 'bg-amber-50' : 'bg-emerald-50'}`}>
              {hasErrors ? (
                <AlertTriangle size={28} className="text-amber-500" />
              ) : (
                <CheckCircle2 size={28} className="text-emerald-500" />
              )}
            </div>
            <p className="text-sm text-slate-700 font-medium">{message}</p>
            {details && (
              <p className="text-xs text-slate-400 mt-1">{details}</p>
            )}
          </div>

          {isBulk && (
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-2xl font-black text-blue-600">{totalRecords}</p>
                  <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Total</p>
                </div>
                <div>
                  <p className="text-2xl font-black text-emerald-600">{totalSynced}</p>
                  <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Synced</p>
                </div>
                <div>
                  <p className={`text-2xl font-black ${failedCount && failedCount > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {failedCount && failedCount > 0 ? failedCount : 0}
                  </p>
                  <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Failed</p>
                </div>
              </div>
            </div>
          )}

          {!isBulk && syncedId && (
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Synced ID:</span>
                <span className="font-bold text-slate-800">#{syncedId}</span>
              </div>
              {caseNumber && (
                <div className="flex items-center justify-between text-xs mt-1">
                  <span className="text-slate-500 font-medium">Case Number:</span>
                  <span className="font-bold text-slate-800">{caseNumber}</span>
                </div>
              )}
            </div>
          )}

          <button
            onClick={onClose}
            className={`w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all active:scale-95 shadow-md ${
              hasErrors 
                ? 'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800'
                : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700'
            }`}
          >
            {hasErrors ? 'Got it' : 'Awesome! 👏'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================
const FcHomeStudyAssessment: React.FC = () => {
  const [viewMode, setViewMode] = useState<'form' | 'list'>('list');
  const [assessmentsList, setAssessmentsList] = useState<HomeStudyAssessmentData[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<HomeStudyAssessmentData>(INITIAL_FORM_STATE);
  const [isTimeDropdownOpen, setIsTimeDropdownOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPushingAll, setIsPushingAll] = useState<boolean>(false);
  const [pushingIds, setPushingIds] = useState<Set<number>>(new Set());
  const [isOnline, setIsOnline] = useState<boolean>(true);
  
  // 🎉 Push Modal States
  const [showPushModal, setShowPushModal] = useState<boolean>(false);
  const [pushModalData, setPushModalData] = useState({
    title: '',
    message: '',
    details: '',
    syncedId: undefined as number | undefined,
    caseNumber: undefined as string | undefined,
    isBulk: false,
    totalSynced: 0,
    totalRecords: 0,
    failedCount: 0,
  });

  // Delete Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteItemId, setDeleteItemId] = useState<number | null>(null);
  const [deleteItemName, setDeleteItemName] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState(false);
  
  const loadList = async () => {
    try {
      const list = await homeStudyService.getAll();
      setAssessmentsList(list);
      
      const online = await checkHomeStudyAPIHealth();
      setIsOnline(online);
    } catch (error) {
      console.error('Error loading list:', error);
      toast.error('Failed to load assessments');
    }
  };

  useEffect(() => {
    loadList();
    
    const interval = setInterval(async () => {
      const online = await checkHomeStudyAPIHealth();
      setIsOnline(online);
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const updateField = (name: keyof HomeStudyAssessmentData, value: any) => {
    if (formData.isCompleted && name !== 'isCompleted') return; 
    setFormData(prev => ({ ...prev, [name]: value }));
  };

 
  const handleHardRefresh = () => {
    setIsRefreshing(true);
    toast.loading('Refreshing...', { id: 'refresh' });
    setTimeout(() => {
      toast.success('Refreshed successfully!', { id: 'refresh' });
      window.location.reload();
    }, 150);
  };

  const handleToggleComplete = async () => {
    if (formData.isCompleted) return;

    if (window.confirm('Are you sure you want to mark this assessment as completed? This will lock the record permanently.')) {
      const updatedState = { ...formData, isCompleted: true };
      setFormData(updatedState); 
      await handleSubmit(undefined, updatedState);
    }
  };

  const openDeleteModal = (id: number, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteItemId(id);
    setDeleteItemName(name || 'Record');
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteItemId) return;
    
    setIsDeleting(true);
    try {
      await homeStudyService.delete(deleteItemId);
      toast.success('🗑️ Record Deleted Successfully!');
      setDeleteModalOpen(false);
      await loadList();
    } catch (error) {
      console.error(error);
      toast.error('❌ Failed to delete record');
    } finally {
      setIsDeleting(false);
      setDeleteItemId(null);
      setDeleteItemName('');
    }
  };

  const closeDeleteModal = () => {
    if (!isDeleting) {
      setDeleteModalOpen(false);
      setDeleteItemId(null);
      setDeleteItemName('');
    }
  };

// 📤 একক রেকর্ড Push - FamilyName, CaregiverFirstName, CaregiverLastName দিয়ে
const handlePushSingleData = async (item: HomeStudyAssessmentData, e: React.MouseEvent) => {
  e.stopPropagation();
  
  const online = await checkHomeStudyAPIHealth();
  if (!online) {
    toast.error('🔴 No internet connection. Please check your network.');
    return;
  }

  if (!item.familyName || !item.caregiverFirstName || !item.caregiverLastName) {
    toast.error('❌ Family Name, Caregiver First Name and Last Name are required to sync!');
    return;
  }

  setPushingIds(prev => new Set(prev).add(item.id || 0));
  const toastId = toast.loading(`Syncing: ${item.caregiverFirstName} ${item.caregiverLastName}...`);
  
  try {
    const result = await syncHomeStudy(item.familyName, item.caregiverFirstName, item.caregiverLastName, item);
    
    if (result.success) {
      toast.success(`✅ ${item.caregiverFirstName} ${item.caregiverLastName} synced successfully!`, { id: toastId });
      console.log('✅ Push Result:', result.data);
      
      setPushModalData({
        title: `${item.caregiverFirstName} ${item.caregiverLastName} Synced`,
        message: 'The home study assessment has been successfully pushed to the server.',
        details: `Family: ${item.familyName}`,
        syncedId: result.syncedId,
        caseNumber: undefined,
        isBulk: false,
        totalSynced: 0,
        totalRecords: 0,
        failedCount: 0,
      });
      setShowPushModal(true);
    } else {
      toast.error(`❌ Failed to sync ${item.caregiverFirstName} ${item.caregiverLastName}: ${result.message}`, { id: toastId });
    }
  } catch (error) {
    console.error('Error pushing data:', error);
    toast.error(`❌ Failed to sync ${item.caregiverFirstName} ${item.caregiverLastName}`, { id: toastId });
  } finally {
    setPushingIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(item.id || 0);
      return newSet;
    });
  }
};

// 📤 সব রেকর্ড Push
const handlePushAllData = async () => {
  if (assessmentsList.length === 0) {
    toast.error('⚠️ No offline data available to push.');
    return;
  }
  
  const online = await checkHomeStudyAPIHealth();
  if (!online) {
    toast.error('🔴 No internet connection. Please check your network.');
    return;
  }
  
  setIsPushingAll(true);
  const toastId = toast.loading(`Syncing total ${assessmentsList.length} records...`);
  
  try {
    const result = await syncMultipleHomeStudies(assessmentsList);
    
    if (result.success) {
      toast.success(`✅ All ${result.totalSynced} records synced successfully!`, { id: toastId });
      console.log('✅ Bulk Push Results:', result.results);
      
      const failedResults = result.results.filter(r => !r.success);
      setPushModalData({
        title: 'Bulk Sync Complete',
        message: `All ${result.totalSynced} records have been synced successfully.`,
        details: 'All your assessment data is now securely stored in the cloud.',
        syncedId: undefined,
        caseNumber: undefined,
        isBulk: true,
        totalSynced: result.totalSynced,
        totalRecords: assessmentsList.length,
        failedCount: failedResults.length,
      });
      setShowPushModal(true);
    } else {
      const failedCount = result.results.filter(r => !r.success).length;
      toast.error(`❌ ${failedCount} out of ${result.results.length} records failed to sync`, { id: toastId });
    }
  } catch (error) {
    console.error('Error pushing all data:', error);
    toast.error('❌ Failed to sync all records', { id: toastId });
  } finally {
    setIsPushingAll(false);
  }
};

// handleSubmit আপডেট
const handleSubmit = async (e?: React.FormEvent, updatedData?: HomeStudyAssessmentData) => {
  if (e) e.preventDefault();
  const dataToSave = updatedData || formData;

  if (!dataToSave.familyName || !dataToSave.caregiverFirstName || !dataToSave.caregiverLastName) {
    toast.error('❌ Family Name, Caregiver First Name and Last Name are required!');
    return;
  }

  try {
    if (editingId) {
      await homeStudyService.update(editingId, dataToSave);
      toast.success(dataToSave.isCompleted ? '🔒 Assessment Completed & Locked!' : '✅ Assessment Updated Successfully!');
    } else {
      await homeStudyService.create(dataToSave);
      localStorage.setItem('note_submitted', 'true');
      toast.success(dataToSave.isCompleted ? '🔒 New Assessment Saved & Locked!' : '✅ New Assessment Saved Successfully!');
    }
    handleCancel();
    await loadList();
  } catch (error) {
    console.error(error);
    toast.error('❌ Failed to save data offline.');
  }
};
  const handleClearAllData = async () => {
    if (window.confirm('⚠️ CRITICAL WARNING!\nThis will delete ALL home study assessment records from your device permanently. Are you absolutely sure?')) {
      toast.loading('Clearing all data...', { id: 'clear-all' });
      try {
        for (const item of assessmentsList) {
          if (item.id) await homeStudyService.delete(item.id);
        }
        toast.success('💥 All offline data cleared successfully.', { id: 'clear-all' });
        await loadList();
      } catch (error) {
        console.error(error);
        toast.error('❌ Failed to clear data', { id: 'clear-all' });
      }
    }
  };

  const handleEdit = (record: HomeStudyAssessmentData) => {
    setFormData(record);
    setEditingId(record.id || null);
    setViewMode('form');
  };

  const handleAddNew = () => {
    setFormData(INITIAL_FORM_STATE);
    setEditingId(null);
    setViewMode('form');
  };

  const handleCancel = () => {
    setFormData(INITIAL_FORM_STATE);
    setEditingId(null);
    setViewMode('list');
  };

  const isReadOnly = formData.isCompleted;

  return (
    <div className="max-w-5xl mx-auto space-y-6 text-slate-800 pb-16 antialiased p-2">
      
      {/* Toaster */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
            padding: '16px',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: '500',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#22c55e',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />

      {/* 🎉 Push Success Modal */}
      <PushSuccessModal
        isOpen={showPushModal}
        onClose={() => setShowPushModal(false)}
        title={pushModalData.title}
        message={pushModalData.message}
        details={pushModalData.details}
        syncedId={pushModalData.syncedId}
        caseNumber={pushModalData.caseNumber}
        isBulk={pushModalData.isBulk}
        totalSynced={pushModalData.totalSynced}
        totalRecords={pushModalData.totalRecords}
        failedCount={pushModalData.failedCount}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={confirmDelete}
        itemName={deleteItemName}
        isDeleting={isDeleting}
      />
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-200/80 pb-5 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
            <FileText size={22} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Home Study Assessment</h2>
            <p className="text-xs font-medium text-slate-500 mt-0.5">
              {viewMode === 'list' ? 'Offline records management' : editingId ? `Editing Record #${editingId}` : 'Create new assessment documentation'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
          
          <span className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold border ${
            isOnline ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
            {isOnline ? '🟢 Online' : '🔴 Offline'}
          </span>

          {viewMode === 'list' ? (
            <>
              <button
                onClick={handleHardRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-1.5 sm:gap-2 border border-slate-200 text-slate-600 hover:text-slate-800 bg-white hover:bg-slate-50 px-3 py-2 sm:px-3.5 rounded-xl text-xs font-semibold transition-all duration-200 active:scale-95 shadow-2xs cursor-pointer disabled:opacity-50"
              >
                <RefreshCw size={14} className={isRefreshing ? "animate-spin text-blue-600" : "opacity-90"} />
                <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
              </button>
              
              <button
                type="button"
                onClick={handlePushAllData}
                disabled={isPushingAll}
                className={`flex items-center gap-1.5 sm:gap-2 bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white px-3 py-2 sm:px-3.5 rounded-xl text-xs font-semibold transition-all duration-200 active:scale-95 shadow-2xs cursor-pointer ${
                  isPushingAll ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isPushingAll ? <Loader2 size={14} className="animate-spin" /> : <CloudLightning size={14} />}
                <span>{isPushingAll ? 'Pushing...' : 'Push All Data'}</span>
              </button>

              <button
                type="button"
                onClick={handleClearAllData}
                className="flex items-center gap-1.5 sm:gap-2 border border-red-200/80 text-red-600 hover:text-red-700 bg-white hover:bg-red-50/60 px-3 py-2 sm:px-3.5 rounded-xl text-xs font-semibold transition-all duration-200 active:scale-95 shadow-2xs cursor-pointer"
              >
                <Trash2 size={14} className="opacity-90" /> 
                <span>Clear All Data</span>
              </button>

              <button
                type="button"
                onClick={handleAddNew}
                className="flex items-center gap-1.5 sm:gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-3.5 py-2 sm:px-4.5 rounded-xl text-xs font-semibold transition-all duration-200 active:scale-95 shadow-md shadow-blue-600/10 cursor-pointer"
              >
                <Plus size={15} strokeWidth={2.5} /> 
                <span>Add New Assessment</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className="flex items-center gap-1.5 sm:gap-2 border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 px-3 py-2 sm:px-3.5 rounded-xl text-xs font-semibold transition-all duration-200 active:scale-95 shadow-2xs cursor-pointer"
            >
              <List size={14} /> 
              <span>View All Records</span>
            </button>
          )}
        </div>
      </div>

      {/* LIST VIEW */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-2xl border border-slate-200/70 shadow-2xs overflow-hidden">
          <div className="p-4 bg-slate-50/70 border-b border-slate-200/60 font-bold text-xs text-slate-500 uppercase tracking-wider">
            Saved Offline Records ({assessmentsList.length})
          </div>
          {assessmentsList.length === 0 ? (
            <div className="p-12 text-center text-sm text-slate-400 font-medium">
              No home study assessments saved yet. Click "Add New" to begin.
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-200/60 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4 sm:px-5">Family Name</th>
<th className="py-3 px-4 sm:px-5">Caregiver First Name</th>
<th className="py-3 px-4 sm:px-5">Caregiver Last Name</th>
<th className="py-3 px-4">Assessment Date & Time</th>
<th className="py-3 px-4 text-center">Status</th>
<th className="py-3 px-4 text-right sm:pr-5">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {assessmentsList.map((item) => {
                    const isPushing = pushingIds.has(item.id || 0);
                    
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/40 transition-all">
                      <td className="py-3.5 px-4 sm:px-5 font-bold text-slate-900">
  <div className="flex items-center gap-2">
    <Users size={14} className="text-slate-400 shrink-0" />
    <span>{item.familyName || 'Not Specified'}</span>
  </div>
</td>
<td className="py-3.5 px-4 sm:px-5 font-bold text-slate-900">
  <div className="flex items-center gap-2">
    <UserRound size={14} className="text-slate-400 shrink-0" />
    <span>{item.caregiverFirstName || 'Not Specified'}</span>
  </div>
</td>
<td className="py-3.5 px-4 sm:px-5 font-bold text-slate-900">
  <div className="flex items-center gap-2">
    <User size={14} className="text-slate-400 shrink-0" />
    <span>{item.caregiverLastName || 'Not Specified'}</span>
  </div>
</td>

                        <td className="py-3.5 px-4 text-xs text-slate-500 font-medium">
                          <div className="flex flex-col gap-0.5">
                            <span className="flex items-center gap-1 text-slate-700 font-semibold">
                              <Calendar size={12} className="text-slate-400" /> {item.assessmentDate}
                            </span>
                            <span className="flex items-center gap-1 text-slate-400">
                              <Clock size={12} /> {item.assessmentTime}
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          {item.isCompleted ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wide bg-emerald-50 text-emerald-700 border border-emerald-100">
                              <ShieldCheck size={12} className="mr-1 shrink-0"/> Locked
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wide bg-purple-50 text-purple-700 border border-purple-100">
                              <Edit2 size={11} className="mr-1 shrink-0"/> Draft
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right whitespace-nowrap sm:pr-5">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={(e) => handlePushSingleData(item, e)}
                              disabled={isPushing || isPushingAll}
                              className={`inline-flex items-center gap-1 px-2 py-1 bg-blue-50/60 hover:bg-blue-50 border border-blue-200 text-blue-600 rounded-lg text-xs font-semibold shadow-3xs transition cursor-pointer ${
                                (isPushing || isPushingAll) ? 'opacity-50 cursor-not-allowed' : ''
                              }`}
                              title="Push data to server"
                            >
                              {(isPushing || isPushingAll) ? <Loader2 size={12} className="animate-spin" /> : <CloudLightning size={12} />}
                              <span className="hidden md:inline">{(isPushing || isPushingAll) ? '...' : 'Push'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleEdit(item)}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 hover:text-blue-600 rounded-lg text-xs font-semibold shadow-3xs transition cursor-pointer"
                              title={item.isCompleted ? 'View details' : 'Edit assessment'}
                            >
                              {item.isCompleted ? <Eye size={12} /> : <Edit2 size={12} />}
                              <span className="hidden md:inline">{item.isCompleted ? 'View' : 'Edit'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={(e) => item.id && openDeleteModal(item.id, `${item.caregiverFirstName} ${item.caregiverLastName}` || 'Record', e)}
                              className="inline-flex items-center justify-center p-1 bg-white hover:bg-red-50 border border-slate-200 hover:border-red-200 text-slate-400 hover:text-red-600 rounded-lg shadow-3xs transition cursor-pointer"
                              title="Delete record"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* FORM VIEW */}
      {viewMode === 'form' && (
        <form onSubmit={(e) => handleSubmit(e)} className="bg-slate-50/60 rounded-2xl p-2 sm:p-4 space-y-6">
          {isReadOnly && (
            <div className="flex items-center gap-2 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200/60 p-4 rounded-xl shadow-2xs">
              <ShieldCheck size={16} className="animate-pulse" /> This assessment document is locked (Read-Only). Changes cannot be saved.
            </div>
          )}

    
<div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/70 shadow-2xs grid grid-cols-1 md:grid-cols-4 gap-5">
  <div>
    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
      <Calendar size={13} className="text-slate-400" /> Assessment Date *
    </label>
    <input 
      type="date" 
      value={formData.assessmentDate} 
      onChange={(e) => updateField('assessmentDate', e.target.value)} 
      disabled={isReadOnly} 
      required
      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white disabled:bg-slate-50 disabled:text-slate-400 focus:outline-none focus:border-blue-500 transition font-medium text-slate-700"
    />
  </div>

  <div className="relative">
    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
      <Clock size={13} className="text-slate-400" /> Assessment Time *
    </label>
    <div 
      onClick={() => !isReadOnly && setIsTimeDropdownOpen(!isTimeDropdownOpen)}
      className={`w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white flex items-center justify-between font-medium text-slate-700 cursor-pointer ${isReadOnly ? 'bg-slate-50 text-slate-400 cursor-not-allowed' : ''}`}
    >
      <span>{formData.assessmentTime}</span>
      <ChevronDown size={14} className="text-slate-400" />
    </div>

    {!isReadOnly && isTimeDropdownOpen && (
      <div className="absolute z-30 w-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg max-h-56 overflow-y-auto p-1">
        {TIME_OPTIONS.map((option) => (
          <div
            key={option.value}
            onClick={() => {
              updateField('assessmentTime', option.value);
              setIsTimeDropdownOpen(false);
            }}
            className={`px-3 py-2 text-xs font-medium rounded-lg cursor-pointer hover:bg-blue-50 hover:text-blue-600 transition ${formData.assessmentTime === option.value ? 'bg-blue-50 text-blue-600' : 'text-slate-700'}`}
          >
            {option.label}
          </div>
        ))}
      </div>
    )}
  </div>

  {/* Family Name Field */}
  <div>
    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
      <Users size={13} className="text-slate-400" /> Family Name *
    </label>
    <input
      type="text"
      value={formData.familyName || ''}
      onChange={(e) => updateField('familyName', e.target.value)}
      disabled={isReadOnly}
      required
      placeholder="e.g. Smith"
      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white disabled:bg-slate-50 disabled:text-slate-400 focus:outline-none focus:border-blue-500 transition font-medium text-slate-700"
    />
  </div>

  {/* Caregiver First Name Field */}
  <div>
    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
      <UserRound size={13} className="text-slate-400" /> Caregiver First Name *
    </label>
    <input
      type="text"
      value={formData.caregiverFirstName || ''}
      onChange={(e) => updateField('caregiverFirstName', e.target.value)}
      disabled={isReadOnly}
      required
      placeholder="e.g. John"
      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white disabled:bg-slate-50 disabled:text-slate-400 focus:outline-none focus:border-blue-500 transition font-medium text-slate-700"
    />
  </div>
</div>

{/* Caregiver Last Name - আলাদা সারিতে */}
<div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/70 shadow-2xs">
  <div className="flex flex-col space-y-1.5">
    <label className="text-xs font-bold text-slate-700 flex items-center gap-2">
      <User size={14} className="text-slate-400" /> Caregiver Last Name *
    </label>
    <input
      type="text"
      value={formData.caregiverLastName || ''}
      onChange={(e) => updateField('caregiverLastName', e.target.value)}
      disabled={isReadOnly}
      required
      placeholder="e.g. Doe"
      className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-sm font-medium transition disabled:bg-slate-50 text-slate-800"
    />
  </div>
</div>

          {/* Contacts Section */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/70 shadow-2xs space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <FormTextArea label="Contacts" field="contacts" formData={formData} isReadOnly={isReadOnly} updateField={updateField} />
              <FormTextArea label="Source of Referral" field="sourceOfReferral" formData={formData} isReadOnly={isReadOnly} updateField={updateField} />
              <FormTextArea label="Directions to Home" field="directionsToHome" formData={formData} isReadOnly={isReadOnly} updateField={updateField} />
              <FormTextArea label="Motivation for Taking Child" field="motivationForTakingChild" formData={formData} isReadOnly={isReadOnly} updateField={updateField} />
            </div>
          </div>

          <FormSection title="Family History">
            <FormTextArea label="Where were you born and raised?" field="bornAndRaised" formData={formData} isReadOnly={isReadOnly} updateField={updateField} />
            <FormTextArea label="What are your parents’ names, where do they live, and briefly describe your relationship with them?" field="parentsDetails" formData={formData} isReadOnly={isReadOnly} updateField={updateField} />
            <FormTextArea label="What are your siblings’ names, ages, and occupation?" field="siblingsDetails" formData={formData} isReadOnly={isReadOnly} updateField={updateField} />
            <FormTextArea label="Describe your relationship with your siblings growing up." field="siblingsRelationship" formData={formData} isReadOnly={isReadOnly} updateField={updateField} />
            <FormTextArea label="How were you raised as a child?" field="howRaised" formData={formData} isReadOnly={isReadOnly} updateField={updateField} />
            <FormTextArea label="How did your family resolve conflict?" field="conflictResolution" formData={formData} isReadOnly={isReadOnly} updateField={updateField} />
            <FormTextArea label="What types of activities did you do as a family?" field="familyActivities" formData={formData} isReadOnly={isReadOnly} updateField={updateField} />
          </FormSection>

          <FormSection title="Self-Description">
            <FormTextArea label="How would you describe yourself?" field="selfDescription" formData={formData} isReadOnly={isReadOnly} updateField={updateField} />
            <FormTextArea label="What are your strengths? Weaknesses?" field="strengthsWeaknesses" formData={formData} isReadOnly={isReadOnly} updateField={updateField} />
            <FormTextArea label="How do you deal with stress?" field="dealWithStress" formData={formData} isReadOnly={isReadOnly} updateField={updateField} />
            <FormTextArea label="What types of things upset you?" field="thingsUpsetYou" formData={formData} isReadOnly={isReadOnly} updateField={updateField} />
          </FormSection>

          <FormSection title="Education">
            <FormTextArea label="Where did you attend high school?" field="highSchool" formData={formData} isReadOnly={isReadOnly} updateField={updateField} />
            <FormTextArea label="How do you view your importance of education?" field="importanceOfEducation" formData={formData} isReadOnly={isReadOnly} updateField={updateField} />
            <FormTextArea label="How do you feel about learning new parenting skills and will you make yourself available to mandatory trainings?" field="newParentingSkills" formData={formData} isReadOnly={isReadOnly} updateField={updateField} />
          </FormSection>

          <FormSection title="Work Experience">
            <FormTextArea label="What is your current occupation and work schedule?" field="currentOccupation" formData={formData} isReadOnly={isReadOnly} updateField={updateField} />
            <FormTextArea label="What are your career plans or anticipated changes?" field="careerPlans" formData={formData} isReadOnly={isReadOnly} updateField={updateField} />
            <FormTextArea label="Have you had work experience that has prepared you for foster care?" field="workExperiencePrep" formData={formData} isReadOnly={isReadOnly} updateField={updateField} />
          </FormSection>

          <FormSection title="Children">
            <FormTextArea label="Describe your children? (Names and ages)" field="describeChildren" formData={formData} isReadOnly={isReadOnly} updateField={updateField} />
            <FormTextArea label="Can you treat a foster child as a member of your own family?" field="treatFosterChild" formData={formData} isReadOnly={isReadOnly} updateField={updateField} />
          </FormSection>

          <FormSection title="Parenting">
            <FormTextArea label="Name some of the things that you do well as a parent?" field="parentWellThings" formData={formData} isReadOnly={isReadOnly} updateField={updateField} />
            <FormTextArea label="What things could you improve on?" field="parentImproveThings" formData={formData} isReadOnly={isReadOnly} updateField={updateField} />
            <FormTextArea label="What things upset you as a parent?" field="parentUpsetThings" formData={formData} isReadOnly={isReadOnly} updateField={updateField} />
            <FormTextArea label="What types of experiences have you dealt with your children inside your home?" field="experiencesInsideHome" formData={formData} isReadOnly={isReadOnly} updateField={updateField} />
            <FormTextArea label="Describe the family’s rules, house rules, and curfew." field="familyRules" formData={formData} isReadOnly={isReadOnly} updateField={updateField} />
          </FormSection>

          <FormSection title="Discipline">
            <FormTextArea label="How do you discipline your own children?" field="disciplineOwnChildren" formData={formData} isReadOnly={isReadOnly} updateField={updateField} />
            <FormTextArea label="What are your thoughts on physical discipline?" field="physicalDisciplineThoughts" formData={formData} isReadOnly={isReadOnly} updateField={updateField} />
          </FormSection>

          <FormSection title="Chemical Use">
            <FormTextArea label="Describe your use of alcohol/mood altering drugs?" field="chemicalUseDescription" formData={formData} isReadOnly={isReadOnly} updateField={updateField} />
            <FormTextArea label="What do you see as acceptable use of alcohol in the family?" field="acceptableAlcoholUse" formData={formData} isReadOnly={isReadOnly} updateField={updateField} />
            <FormTextArea label="Has there ever been a problem with anyone in your close or extended family?" field="familyChemicalProblem" formData={formData} isReadOnly={isReadOnly} updateField={updateField} />
          </FormSection>

          <FormSection title="Ethical and Spiritual Beliefs">
            <FormTextArea label="What role do your spirituality/culture play in your life?" field="spiritualityCultureRole" formData={formData} isReadOnly={isReadOnly} updateField={updateField} />
            <FormTextArea label="What if a child’s beliefs differ from your own?" field="childBeliefsDiffer" formData={formData} isReadOnly={isReadOnly} updateField={updateField} />
            <FormTextArea label="What if a child’s personal beliefs differ from your own?" field="childPersonalBeliefsDiffer" formData={formData} isReadOnly={isReadOnly} updateField={updateField} />
          </FormSection>

          <FormSection title="Finances">
            <FormTextArea label="How is money handled? How are financial decisions decided in your family’s?" field="moneyHandled" formData={formData} isReadOnly={isReadOnly} updateField={updateField} />
            <FormTextArea label="Describe your future and present financial picture?" field="financialPicture" formData={formData} isReadOnly={isReadOnly} updateField={updateField} />
          </FormSection>

          {/* Lock Configuration */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/70 shadow-2xs">
            <div 
              onClick={handleToggleComplete}
              className={`flex items-start gap-4 bg-slate-50/50 hover:bg-slate-50 border border-slate-200/50 p-4 rounded-xl select-none transition-all group ${isReadOnly ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
            >
              <div className="relative flex items-center justify-center w-5 h-5 mt-0.5 shrink-0">
                <input type="checkbox" checked={formData.isCompleted} readOnly className="sr-only" />
                <div className={`w-5 h-5 bg-white border rounded-md flex items-center justify-center transition-all shadow-3xs group-hover:border-slate-400 ${formData.isCompleted ? 'border-emerald-600 bg-emerald-50' : 'border-slate-300'}`}>
                  {formData.isCompleted && (
                    <Check size={14} strokeWidth={3} className="text-emerald-600" />
                  )}
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <ShieldCheck size={13} className="text-slate-400" /> Mark as Completed (Lock this assessment)
                </span>
                <span className="text-[10px] font-medium text-slate-400/90 mt-0.5">Freezes this record asset. Safe lock mechanism prevents further mutations.</span>
              </div>
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="flex justify-end items-center gap-2 pt-5 border-t border-slate-200/80">
            <button 
              type="button" 
              onClick={handleCancel} 
              className="flex items-center gap-1.5 sm:gap-2 border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 px-4 py-2 sm:px-4.5 rounded-xl text-xs font-semibold transition-all duration-200 active:scale-95 shadow-2xs cursor-pointer"
            >
              <X size={14} /> 
              <span>Back to List</span>
            </button>
            
            {!isReadOnly && (
              <button 
                type="submit" 
                className="flex items-center gap-1.5 sm:gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2 sm:px-4.5 rounded-xl text-xs font-semibold transition-all duration-200 active:scale-95 shadow-md shadow-blue-600/10 cursor-pointer"
              >
                <Save size={14} /> 
                <span>{editingId ? 'Update Assessment' : 'Save Assessment'}</span>
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
};

export default FcHomeStudyAssessment;