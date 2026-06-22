import React, { useState, useEffect } from 'react';
import { 
  Calendar, Clock, ShieldCheck, Check, Save, X, List, Plus, Edit2, 
  Eye, Trash2, CloudLightning, ChevronDown, User, FileEdit, AlertCircle, 
  RefreshCw, Loader2, Users, UserRound
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { visitNotesService } from '../services/visitNotesService';
import { 
  checkVisitNotesAPIHealth, 
  syncVisitNotes, 
  syncMultipleVisitNotes 
} from '../services/visitNotesApiForLive';
import type { VisitNotesData } from '../types/visitNotes';

// ============================================
// CONSTANTS
// ============================================
const APPOINTMENT_TYPES = [
  'Email', 'Face to Face', 'letter', 'N/A', 
  'Note to file', 'phone', 'Staffing', 'Text', 'Virtual'
] as const;

const CONCERNS_APPOINTMENTS_OPTIONS = [
  'Dental',
  'Health',
  'Optical',
  'Mental Health'
] as const;

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

// ============================================
// PUSH SUCCESS MODAL
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
                <AlertCircle size={20} className="text-amber-600" />
              ) : (
                <Check size={20} className="text-emerald-600" />
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
                <AlertCircle size={28} className="text-amber-500" />
              ) : (
                <Check size={28} className="text-emerald-500" />
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
// DELETE CONFIRMATION MODAL
// ============================================
interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName: string;
  isDeleting: boolean;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  itemName,
  isDeleting
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden transform transition-all scale-100 animate-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <Trash2 size={20} className="text-red-600" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Delete Record</h3>
          </div>
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            disabled={isDeleting}
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <p className="text-sm text-slate-600">
            Are you sure you want to delete <span className="font-semibold text-slate-900">"{itemName}"</span>?
          </p>
          <p className="text-xs text-slate-400">This action cannot be undone.</p>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="w-1/2 py-2.5 rounded-xl text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all active:scale-95 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isDeleting}
              className={`w-1/2 py-2.5 rounded-xl text-sm font-semibold text-white transition-all active:scale-95 shadow-md ${
                isDeleting 
                  ? 'bg-slate-400 cursor-not-allowed' 
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {isDeleting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={16} className="animate-spin" />
                  Deleting...
                </span>
              ) : (
                'Delete'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// FORM SUB-COMPONENTS
// ============================================
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
  field: keyof VisitNotesData;
  formData: VisitNotesData;
  isReadOnly: boolean;
  updateField: (name: keyof VisitNotesData, value: any) => void;
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
      placeholder={isReadOnly ? "No response recorded" : "Type details here..."}
    />
  </div>
);

// ============================================
// MAIN COMPONENT
// ============================================
const INITIAL_FORM_STATE: VisitNotesData = {
  date: new Date().toISOString().split('T')[0],
  time: '10:00 AM',
  familyName: '',
  firstName: '',
  lastName: '',
  concernsAppointments: '',
  appointmentType: 'Face to Face',
  babyProgramsGrowth: '',
  schoolActivities: '',
  independentLivingSkills: '',
  purchasesForChild: '',
  familyVisitsSummary: '',
  childIssuesBehaviors: '',
  safetyFireExtinguisher: false,
  safetySmokeDetectors: false,
  safetyCarbonDetector: false,
  safetyEmergencyNumbers: false,
  safetyFirstAidKit: false,
  safetyTwoFormsOfExit: false,
  safetyRunningHeatedWater: false,
  safetyWillingRespiteHome: false,
  childrenSleepLocation: '',
  medicationsStorage: '',
  cleanersStorage: '',
  contactInfoUpToDate: '',
  additionalComments: '',
  fosterCareAssistantSignature: '',
  isCompleted: false,
  caseNumber: '',
};

const FcVisitNotes: React.FC = () => {
  const [viewMode, setViewMode] = useState<'form' | 'list'>('list');
  const [notesList, setNotesList] = useState<VisitNotesData[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<VisitNotesData>(INITIAL_FORM_STATE);
  
  const [isTimeDropdownOpen, setIsTimeDropdownOpen] = useState(false);
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const [isConcernsDropdownOpen, setIsConcernsDropdownOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPushingAll, setIsPushingAll] = useState<boolean>(false);
  const [pushingIds, setPushingIds] = useState<Set<number>>(new Set());
  const [isOnline, setIsOnline] = useState<boolean>(true);
  
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

  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [deleteItemId, setDeleteItemId] = useState<number | null>(null);
  const [deleteItemName, setDeleteItemName] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const loadList = async () => {
    try {
      const list = await visitNotesService.getAll();
      setNotesList(list);
      
      const online = await checkVisitNotesAPIHealth();
      setIsOnline(online);
    } catch (error) {
      console.error('Error loading list:', error);
      toast.error('Failed to load visit notes');
    }
  };

  useEffect(() => {
    loadList();
    
    const interval = setInterval(async () => {
      const online = await checkVisitNotesAPIHealth();
      setIsOnline(online);
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const updateField = (name: keyof VisitNotesData, value: any) => {
    if (formData.isCompleted && name !== 'isCompleted') return;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e?: React.FormEvent, updatedData?: VisitNotesData) => {
    if (e) e.preventDefault();
    const dataToSave = updatedData || formData;

    if (!dataToSave.familyName || !dataToSave.firstName || !dataToSave.lastName) {
      toast.error('❌ Family Name, First Name and Last Name are required!');
      return;
    }

    try {
      if (editingId) {
        await visitNotesService.update(editingId, dataToSave);
        toast.success(dataToSave.isCompleted ? '🔒 Visit Notes Completed & Locked!' : '✅ Visit Notes Updated Successfully!');
      } else {
        await visitNotesService.create(dataToSave);
        toast.success(dataToSave.isCompleted ? '🔒 New Visit Notes Saved & Locked!' : '✅ New Visit Notes Saved Successfully!');
      }
      handleCancel();
      await loadList();
    } catch (error) {
      console.error(error);
      toast.error('❌ Failed to save data offline.');
    }
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

    if (window.confirm('Are you sure you want to mark this visit note as completed? This will lock the record permanently.')) {
      const updatedState = { ...formData, isCompleted: true };
      setFormData(updatedState);
      await handleSubmit(undefined, updatedState);
    }
  };

  const openDeleteModal = (id: number, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteItemId(id);
    setDeleteItemName(name || 'Record');
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deleteItemId) return;
    
    setIsDeleting(true);
    try {
      await visitNotesService.delete(deleteItemId);
      toast.success('🗑️ Record Deleted Successfully!');
      setShowDeleteModal(false);
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
      setShowDeleteModal(false);
      setDeleteItemId(null);
      setDeleteItemName('');
    }
  };

  const handlePushSingleData = async (item: VisitNotesData, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const online = await checkVisitNotesAPIHealth();
    if (!online) {
      toast.error('🔴 No internet connection. Please check your network.');
      return;
    }

    if (!item.familyName || !item.firstName || !item.lastName) {
      toast.error('❌ Family Name, First Name and Last Name are required to sync!');
      return;
    }

    setPushingIds(prev => new Set(prev).add(item.id || 0));
    const toastId = toast.loading(`Syncing: ${item.firstName} ${item.lastName}...`);
    
    try {
      const result = await syncVisitNotes(item.familyName, item.firstName, item.lastName, item);
      
      if (result.success) {
        toast.success(`✅ ${item.firstName} ${item.lastName} synced successfully!`, { id: toastId });
        console.log('✅ Push Result:', result.data);
        
        setPushModalData({
          title: `${item.firstName} ${item.lastName} Synced`,
          message: 'The visit note has been successfully pushed to the server.',
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
        toast.error(`❌ Failed to sync ${item.firstName} ${item.lastName}: ${result.message}`, { id: toastId });
      }
    } catch (error) {
      console.error('Error pushing data:', error);
      toast.error(`❌ Failed to sync ${item.firstName} ${item.lastName}`, { id: toastId });
    } finally {
      setPushingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(item.id || 0);
        return newSet;
      });
    }
  };

  const handlePushAllData = async () => {
    if (notesList.length === 0) {
      toast.error('⚠️ No offline data available to push.');
      return;
    }
    
    const online = await checkVisitNotesAPIHealth();
    if (!online) {
      toast.error('🔴 No internet connection. Please check your network.');
      return;
    }
    
    setIsPushingAll(true);
    const toastId = toast.loading(`Syncing total ${notesList.length} records...`);
    
    try {
      const result = await syncMultipleVisitNotes(notesList);
      
      if (result.success) {
        toast.success(`✅ All ${result.totalSynced} records synced successfully!`, { id: toastId });
        console.log('✅ Bulk Push Results:', result.results);
        
        const failedResults = result.results.filter(r => !r.success);
        setPushModalData({
          title: 'Bulk Sync Complete',
          message: `All ${result.totalSynced} records have been synced successfully.`,
          details: 'All your visit notes are now securely stored in the cloud.',
          syncedId: undefined,
          caseNumber: undefined,
          isBulk: true,
          totalSynced: result.totalSynced,
          totalRecords: notesList.length,
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

  const handleClearAllData = async () => {
    if (window.confirm('⚠️ CRITICAL WARNING!\nThis will delete ALL visit notes from IndexedDB. Are you sure?')) {
      try {
        await visitNotesService.clearAll();
        toast.success('💥 All offline visit notes cleared.');
        await loadList();
      } catch (error) {
        console.error(error);
        toast.error('❌ Failed to clear data');
      }
    }
  };

  const handleEdit = (record: VisitNotesData) => {
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
    setIsTimeDropdownOpen(false);
    setIsTypeDropdownOpen(false);
    setIsConcernsDropdownOpen(false);
  };

  const isReadOnly = formData.isCompleted;

  return (
    <div className="max-w-7xl mx-auto space-y-6 text-slate-800 pb-16 antialiased p-4">
      
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

      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={closeDeleteModal}
        onConfirm={confirmDelete}
        itemName={deleteItemName}
        isDeleting={isDeleting}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-200/80 pb-5 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
            <FileEdit size={22} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Visit Notes</h2>
            <p className="text-xs font-medium text-slate-500 mt-0.5">
              {viewMode === 'list' ? 'Offline visit documentation list' : editingId ? `Editing Note #${editingId}` : 'Create new visit documentation'}
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
                className={`flex items-center gap-1.5 bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white px-3 py-2 rounded-xl text-xs font-semibold transition shadow-2xs cursor-pointer ${
                  isPushingAll ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isPushingAll ? <Loader2 size={14} className="animate-spin" /> : <CloudLightning size={14} />}
                <span>{isPushingAll ? 'Pushing...' : 'Push All Data'}</span>
              </button>

              <button
                type="button"
                onClick={handleClearAllData}
                className="flex items-center gap-1.5 border border-red-200 text-red-600 bg-white hover:bg-red-50 px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                <Trash2 size={14} /> 
                <span>Clear All Data</span>
              </button>

              <button
                type="button"
                onClick={handleAddNew}
                className="flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-3.5 py-2 rounded-xl text-xs font-semibold transition shadow-md shadow-blue-600/10 cursor-pointer"
              >
                <Plus size={15} strokeWidth={2.5} /> 
                <span>Add Visit Notes</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className="flex items-center gap-1.5 border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              <List size={14} /> 
              <span>View All Records</span>
            </button>
          )}
        </div>
      </div>

      {/* TABLE VIEW */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-2xl border border-slate-200/70 shadow-2xs overflow-hidden w-full">
          <div className="p-4 bg-slate-50/70 border-b border-slate-200/60 font-bold text-xs text-slate-500 uppercase tracking-wider">
            Saved Offline Visit Notes ({notesList.length})
          </div>
          {notesList.length === 0 ? (
            <div className="p-12 text-center text-sm text-slate-400 font-medium">
              No visit notes saved yet. Click "Add Visit Notes" to begin.
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[1200px] lg:min-w-full table-auto">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-200/60 text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                    <th className="py-4 px-5 w-[12%] min-w-[120px]">Family Name</th>
                    <th className="py-4 px-5 w-[14%] min-w-[140px]">Children First Name</th>
                    <th className="py-4 px-5 w-[14%] min-w-[140px]">Children Last Name</th>
                    <th className="py-4 px-4 w-[18%] min-w-[160px]">Concerns / Appointments</th>
                    <th className="py-4 px-4 w-[12%] min-w-[120px]">Appointment Type</th>
                    <th className="py-4 px-4 w-[12%] min-w-[130px]">Date & Time</th>
                    <th className="py-4 px-4 text-center w-[8%] min-w-[80px]">Status</th>
                    <th className="py-4 px-5 text-right w-[140px] min-w-[140px]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {notesList.map((item) => {
                    const isPushing = pushingIds.has(item.id || 0);
                    
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/40 transition-all">
                        <td className="py-3.5 px-5 font-bold text-slate-900">
                          <div className="flex items-center gap-2">
                            <Users size={14} className="text-slate-400 shrink-0" />
                            <span>{item.familyName || 'Not Specified'}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-5 font-bold text-slate-900">
                          <div className="flex items-center gap-2">
                            <UserRound size={14} className="text-slate-400 shrink-0" />
                            <span>{item.firstName || 'Not Specified'}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-5 font-bold text-slate-900">
                          <div className="flex items-center gap-2">
                            <User size={14} className="text-slate-400 shrink-0" />
                            <span>{item.lastName || 'Not Specified'}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-slate-600 font-medium">
                          {item.concernsAppointments ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                              {item.concernsAppointments}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs italic">Not selected</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2 py-0.5 bg-purple-50 text-purple-700 rounded-md text-xs font-medium border border-purple-100">
                            {item.appointmentType}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-xs text-slate-500 font-medium whitespace-nowrap">
                          <div className="flex flex-col gap-0.5">
                            <span className="flex items-center gap-1 text-slate-700 font-semibold">
                              <Calendar size={12} className="text-slate-400" /> {item.date}
                            </span>
                            <span className="flex items-center gap-1 text-slate-400">
                              <Clock size={12} /> {item.time}
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

                        <td className="py-3.5 px-5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={(e) => handlePushSingleData(item, e)}
                              disabled={isPushing || isPushingAll}
                              className={`inline-flex items-center gap-1 px-2 py-1 bg-blue-50/60 hover:bg-blue-50 border border-blue-200 text-blue-600 rounded-lg text-xs font-semibold shadow-3xs transition cursor-pointer ${
                                (isPushing || isPushingAll) ? 'opacity-50 cursor-not-allowed' : ''
                              }`}
                            >
                              {(isPushing || isPushingAll) ? <Loader2 size={12} className="animate-spin" /> : <CloudLightning size={12} />}
                              <span>{(isPushing || isPushingAll) ? '...' : 'Push'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleEdit(item)}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold shadow-3xs cursor-pointer"
                            >
                              {item.isCompleted ? <Eye size={12} /> : <Edit2 size={12} />}
                              <span>{item.isCompleted ? 'View' : 'Edit'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={(e) => item.id && openDeleteModal(item.id, `${item.firstName} ${item.lastName}` || 'Record', e)}
                              className="inline-flex items-center p-1 bg-white border border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-300 rounded-lg shadow-3xs transition cursor-pointer"
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
              <ShieldCheck size={16} className="animate-pulse" /> This document is locked (Read-Only). Changes cannot be saved.
            </div>
          )}

          {/* Core Master Meta Parameters */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/70 shadow-2xs grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Calendar size={13} className="text-slate-400" /> Date *
              </label>
              <input 
                type="date" 
                value={formData.date} 
                onChange={(e) => updateField('date', e.target.value)} 
                disabled={isReadOnly} 
                required
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white disabled:bg-slate-50 disabled:text-slate-400 focus:outline-none focus:border-blue-500 transition font-medium text-slate-700"
              />
            </div>

            <div className="relative">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Clock size={13} className="text-slate-400" /> Time *
              </label>
              <div 
                onClick={() => !isReadOnly && setIsTimeDropdownOpen(!isTimeDropdownOpen)}
                className={`w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white flex items-center justify-between font-medium text-slate-700 cursor-pointer ${isReadOnly ? 'bg-slate-50 text-slate-400 cursor-not-allowed' : ''}`}
              >
                <span>{formData.time}</span>
                <ChevronDown size={14} className="text-slate-400" />
              </div>

              {!isReadOnly && isTimeDropdownOpen && (
                <div className="absolute z-30 w-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg max-h-56 overflow-y-auto p-1">
                  {TIME_OPTIONS.map((option) => (
                    <div
                      key={option.value}
                      onClick={() => {
                        updateField('time', option.value);
                        setIsTimeDropdownOpen(false);
                      }}
                      className={`px-3 py-2 text-xs font-medium rounded-lg cursor-pointer hover:bg-blue-50 hover:text-blue-600 transition ${formData.time === option.value ? 'bg-blue-50 text-blue-600' : ''}`}
                    >
                      {option.label}
                    </div>
                  ))}
                </div>
              )}
            </div>

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

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <UserRound size={13} className="text-slate-400" /> Children First Name *
              </label>
              <input
                type="text"
                value={formData.firstName || ''}
                onChange={(e) => updateField('firstName', e.target.value)}
                disabled={isReadOnly}
                required
                placeholder="e.g. John"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white disabled:bg-slate-50 disabled:text-slate-400 focus:outline-none focus:border-blue-500 transition font-medium text-slate-700"
              />
            </div>
          </div>

          {/* Children Last Name */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/70 shadow-2xs">
            <div className="flex flex-col space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-2">
                <User size={14} className="text-slate-400" /> Children Last Name *
              </label>
              <input
                type="text"
                value={formData.lastName || ''}
                onChange={(e) => updateField('lastName', e.target.value)}
                disabled={isReadOnly}
                required
                placeholder="e.g. Doe"
                className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-sm font-medium transition disabled:bg-slate-50 text-slate-800"
              />
            </div>
          </div>

          {/* ⭐ Appointment Type & Concerns/Appointments Dropdown */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/70 shadow-2xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Appointment Type Dropdown */}
              <div className="relative">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Appointment Type
                </label>
                <div 
                  onClick={() => !isReadOnly && setIsTypeDropdownOpen(!isTypeDropdownOpen)}
                  className={`w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white flex items-center justify-between font-medium text-slate-700 cursor-pointer ${isReadOnly ? 'bg-slate-50 text-slate-400 cursor-not-allowed' : ''}`}
                >
                  <span>{formData.appointmentType}</span>
                  <ChevronDown size={14} className="text-slate-400" />
                </div>

                {!isReadOnly && isTypeDropdownOpen && (
                  <div className="absolute z-30 w-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg max-h-56 overflow-y-auto p-1">
                    {APPOINTMENT_TYPES.map((type) => (
                      <div
                        key={type}
                        onClick={() => {
                          updateField('appointmentType', type);
                          setIsTypeDropdownOpen(false);
                        }}
                        className={`px-3 py-2 text-xs font-medium rounded-lg cursor-pointer hover:bg-blue-50 hover:text-blue-600 transition ${formData.appointmentType === type ? 'bg-blue-50 text-blue-600' : ''}`}
                      >
                        {type}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ⭐ Concerns / Appointments Dropdown */}
              <div className="relative">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <AlertCircle size={13} className="text-slate-400" /> Concerns / Appointments
                </label>
                <div 
                  onClick={() => !isReadOnly && setIsConcernsDropdownOpen(!isConcernsDropdownOpen)}
                  className={`w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white flex items-center justify-between font-medium text-slate-700 cursor-pointer ${isReadOnly ? 'bg-slate-50 text-slate-400 cursor-not-allowed' : ''}`}
                >
                  <span>{formData.concernsAppointments || 'Select Concerns/Appointments'}</span>
                  <ChevronDown size={14} className="text-slate-400" />
                </div>

                {!isReadOnly && isConcernsDropdownOpen && (
                  <div className="absolute z-30 w-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg max-h-56 overflow-y-auto p-1">
                    {CONCERNS_APPOINTMENTS_OPTIONS.map((option) => (
                      <div
                        key={option}
                        onClick={() => {
                          updateField('concernsAppointments', option);
                          setIsConcernsDropdownOpen(false);
                        }}
                        className={`px-3 py-2 text-xs font-medium rounded-lg cursor-pointer hover:bg-blue-50 hover:text-blue-600 transition ${formData.concernsAppointments === option ? 'bg-blue-50 text-blue-600' : ''}`}
                      >
                        {option}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <FormSection title="Program, Activities & Development">
            <FormTextArea label="Baby/Toddler programs enrolled in, growth, & development" field="babyProgramsGrowth" formData={formData} isReadOnly={isReadOnly} updateField={updateField} />
            <FormTextArea label="School Activities" field="schoolActivities" formData={formData} isReadOnly={isReadOnly} updateField={updateField} />
            <FormTextArea label="16 & older: independent living skills, working, driving classes, activities" field="independentLivingSkills" formData={formData} isReadOnly={isReadOnly} updateField={updateField} />
            <FormTextArea label="Purchases for child, such as clothing, diapers, etc. (amount should reflect $75/month): Receipts" field="purchasesForChild" formData={formData} isReadOnly={isReadOnly} updateField={updateField} />
          </FormSection>

          <FormSection title="Visits & Behavior Assessment">
            <FormTextArea label="Family Visits, dates with Summary" field="familyVisitsSummary" formData={formData} isReadOnly={isReadOnly} updateField={updateField} />
            <FormTextArea label="Child Issues, behaviors, concerns, comments" field="childIssuesBehaviors" formData={formData} isReadOnly={isReadOnly} updateField={updateField} />
          </FormSection>

          {/* Safety Checkboxes */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/70 shadow-2xs space-y-4">
            <div className="text-blue-700 font-extrabold text-sm tracking-wider uppercase border-b border-slate-100 pb-2 mb-2">
              Child Issues, behaviors, concerns (Home Safety Verification)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2">
              {[
                { label: 'Fire Extinguisher', field: 'safetyFireExtinguisher' },
                { label: 'Smoke Detectors', field: 'safetySmokeDetectors' },
                { label: 'Carbon Detector', field: 'safetyCarbonDetector' },
                { label: "Emergency #’s", field: 'safetyEmergencyNumbers' },
                { label: 'First Aid Kit', field: 'safetyFirstAidKit' },
                { label: 'Two Forms of Exit?', field: 'safetyTwoFormsOfExit' },
                { label: 'Running, Heated Water?', field: 'safetyRunningHeatedWater' },
                { label: 'Are you willing to be considered a respite home?', field: 'safetyWillingRespiteHome' },
              ].map((item) => {
                const currentVal = formData[item.field as keyof VisitNotesData] as boolean;
                return (
                  <div 
                    key={item.field}
                    onClick={() => !isReadOnly && updateField(item.field as keyof VisitNotesData, !currentVal)}
                    className={`flex items-start gap-3 p-3 rounded-xl border border-slate-100 transition-all ${isReadOnly ? 'opacity-70 cursor-not-allowed' : 'hover:bg-slate-50/80 cursor-pointer select-none'}`}
                  >
                    <div className="relative flex items-center justify-center w-4 h-4 mt-0.5 shrink-0">
                      <div className={`w-4 h-4 bg-white border rounded transition-all ${currentVal ? 'border-blue-600 bg-blue-50' : 'border-slate-300'}`}>
                        {currentVal && <Check size={12} strokeWidth={3} className="text-blue-600" />}
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-slate-700">{item.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <FormSection title="Home Environment & Logistics">
            <FormTextArea label="Where do the children sleep?" field="childrenSleepLocation" formData={formData} isReadOnly={isReadOnly} updateField={updateField} />
            <FormTextArea label="Where are medications stored?" field="medicationsStorage" formData={formData} isReadOnly={isReadOnly} updateField={updateField} />
            <FormTextArea label="Where are cleaners stored?" field="cleanersStorage" formData={formData} isReadOnly={isReadOnly} updateField={updateField} />
            <FormTextArea label="Phone numbers and email address up to date?" field="contactInfoUpToDate" formData={formData} isReadOnly={isReadOnly} updateField={updateField} />
          </FormSection>

          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/70 shadow-2xs space-y-5">
            <FormTextArea label="Additional Comments" field="additionalComments" formData={formData} isReadOnly={isReadOnly} updateField={updateField} />
            <div className="flex flex-col space-y-1.5 md:w-1/2 pt-2">
              <label className="text-xs font-bold text-slate-700">Foster Care Assistant Signature *</label>
              <input
                type="text"
                value={formData.fosterCareAssistantSignature || ''}
                onChange={(e) => updateField('fosterCareAssistantSignature', e.target.value)}
                disabled={isReadOnly}
                required
                placeholder="Type full legal name for signature"
                className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-sm font-medium transition disabled:bg-slate-50 text-slate-800"
              />
            </div>
          </div>

          {/* Operational Freeze Checkbox */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/70 shadow-2xs">
            <div 
              onClick={handleToggleComplete}
              className={`flex items-start gap-4 bg-slate-50/50 hover:bg-slate-50 border border-slate-200/50 p-4 rounded-xl select-none transition-all group ${isReadOnly ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
            >
              <div className="relative flex items-center justify-center w-5 h-5 mt-0.5 shrink-0">
                <div className={`w-5 h-5 bg-white border rounded-md flex items-center justify-center transition-all shadow-3xs group-hover:border-slate-400 ${formData.isCompleted ? 'border-emerald-600 bg-emerald-50' : 'border-slate-300'}`}>
                  {formData.isCompleted && (
                    <Check size={14} strokeWidth={3} className="text-emerald-600" />
                  )}
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <ShieldCheck size={13} className="text-slate-400" /> Mark as Completed. (And lock this Assessment as Read Only)
                </span>
                <span className="text-[10px] font-medium text-slate-400/90 mt-0.5">Freezes this record asset. Safe lock mechanism prevents further mutations.</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end items-center gap-2 pt-5 border-t border-slate-200/80">
            <button 
              type="button" 
              onClick={handleCancel} 
              className="flex items-center gap-1.5 border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              <X size={14} /> 
              <span>Cancel</span>
            </button>
            
            {!isReadOnly && (
              <button 
                type="submit" 
                className="flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-semibold transition shadow-md shadow-blue-600/10 cursor-pointer"
              >
                <Save size={14} /> 
                <span>Save</span>
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
};

export default FcVisitNotes;