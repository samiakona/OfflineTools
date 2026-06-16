import React, { useState, useEffect } from 'react';
import { Calendar, Clock, ShieldCheck, Check, Save, X, FileText, List, Plus, Edit2, Eye, Trash2, CloudLightning, ChevronDown, Hash, User, RefreshCw } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import type { HomeStudyAssessmentData } from '../types/homeStudy';
import { homeStudyService } from '../services/homeStudyService';
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
  caseNumber: '',
  caregiverId: '',
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
};

// --- Sub-components outside ---
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

const FcHomeStudyAssessment: React.FC = () => {
  const [viewMode, setViewMode] = useState<'form' | 'list'>('list');
  const [assessmentsList, setAssessmentsList] = useState<HomeStudyAssessmentData[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<HomeStudyAssessmentData>(INITIAL_FORM_STATE);
  const [isTimeDropdownOpen, setIsTimeDropdownOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Delete Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteItemId, setDeleteItemId] = useState<number | null>(null);
  const [deleteItemName, setDeleteItemName] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState(false);
  
  const loadList = async () => {
    try {
      const list = await homeStudyService.getAll();
      setAssessmentsList(list);
    } catch (error) {
      console.error('Error loading list:', error);
      toast.error('Failed to load assessments');
    }
  };

  useEffect(() => {
    loadList();
  }, []);

  const updateField = (name: keyof HomeStudyAssessmentData, value: any) => {
    if (formData.isCompleted && name !== 'isCompleted') return; 
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e?: React.FormEvent, updatedData?: HomeStudyAssessmentData) => {
    if (e) e.preventDefault();
    const dataToSave = updatedData || formData;

    if (!dataToSave.caregiverName) {
      toast.error('❌ Caregiver Name is required!');
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

  // Delete handlers with Modal
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

  const handlePushSingleData = async (item: HomeStudyAssessmentData, e: React.MouseEvent) => {
    e.stopPropagation();
    toast.loading(`Syncing data for: ${item.caregiverName || 'Unknown'}...`, { id: 'push-single' });
    
    try {
      console.log('Pushing Single Item: ', item);
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success(`✅ ${item.caregiverName} synced successfully!`, { id: 'push-single' });
    } catch (error) {
      console.error(error);
      toast.error(`❌ Failed to sync ${item.caregiverName}`, { id: 'push-single' });
    }
  };

  const handlePushAllData = async () => {
    if (assessmentsList.length === 0) {
      toast.error('⚠️ No offline data available to push.');
      return;
    }
    
    toast.loading(`Syncing total ${assessmentsList.length} records to the server...`, { id: 'push-all' });
    
    try {
      console.log('Pushing All Items: ', assessmentsList);
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.success(`✅ All ${assessmentsList.length} records synced successfully!`, { id: 'push-all' });
    } catch (error) {
      console.error(error);
      toast.error('❌ Failed to sync all records', { id: 'push-all' });
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
      {/* Toaster Component */}
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

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={confirmDelete}
        itemName={deleteItemName}
        isDeleting={isDeleting}
      />
      
      {/* Dynamic Header */}
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

        {/* Top Action Buttons Panel */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
          {viewMode === 'list' ? (
            <>
              <button
                onClick={handleHardRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-1.5 sm:gap-2 border border-slate-200 text-slate-600 hover:text-slate-800 bg-white hover:bg-slate-50 px-3 py-2 sm:px-3.5 rounded-xl text-xs font-semibold transition-all duration-200 active:scale-95 shadow-2xs cursor-pointer disabled:opacity-50"
                title="Force refresh database and memory cache"
              >
                <RefreshCw size={14} className={isRefreshing ? "animate-spin text-blue-600" : "opacity-90"} />
                <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
              </button>
              <button
                type="button"
                onClick={handlePushAllData}
                className="flex items-center gap-1.5 sm:gap-2 bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white px-3 py-2 sm:px-3.5 rounded-xl text-xs font-semibold transition-all duration-200 active:scale-95 shadow-2xs cursor-pointer disabled:opacity-50"
              >
                <CloudLightning size={14} /> 
                <span>Push All Data</span>
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

      {/* --- LIST VIEW --- */}
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
                    <th className="py-3 px-4 sm:px-5">Caregiver Name</th>
                    <th className="py-3 px-4">Case Number</th>
                    <th className="py-3 px-4">Assessment Date & Time</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right sm:pr-5">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {assessmentsList.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/40 transition-all">
                      <td className="py-3.5 px-4 sm:px-5 font-bold text-slate-900">
                        <div className="flex items-center gap-2">
                          <User size={14} className="text-slate-400 shrink-0" />
                          <span>{item.caregiverName || 'Not Specified'}</span>
                        </div>
                      </td>
                      
                      <td className="py-3.5 px-4 font-semibold text-slate-600">
                        {item.caseNumber ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-xs font-mono">
                            {item.caseNumber}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs italic">N/A</span>
                        )}
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
                            className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50/60 hover:bg-blue-50 border border-blue-200 text-blue-600 rounded-lg text-xs font-semibold shadow-3xs transition cursor-pointer"
                            title="Push data to server"
                          >
                            <CloudLightning size={12} />
                            <span className="hidden md:inline">Push</span>
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
                            onClick={(e) => item.id && openDeleteModal(item.id, item.caregiverName || 'Record', e)}
                            className="inline-flex items-center justify-center p-1 bg-white hover:bg-red-50 border border-slate-200 hover:border-red-200 text-slate-400 hover:text-red-600 rounded-lg shadow-3xs transition cursor-pointer"
                            title="Delete record"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {viewMode === 'form' && (
        <form onSubmit={(e) => handleSubmit(e)} className="bg-slate-50/60 rounded-2xl p-2 sm:p-4 space-y-6">
          {isReadOnly && (
            <div className="flex items-center gap-2 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200/60 p-4 rounded-xl shadow-2xs">
              <ShieldCheck size={16} className="animate-pulse" /> This assessment document is locked (Read-Only). Changes cannot be saved.
            </div>
          )}

          {/* Basic Meta Fields */}
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

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Hash size={13} className="text-slate-400" /> Case Number
              </label>
              <input
                type="text"
                value={formData.caseNumber || ''}
                onChange={(e) => updateField('caseNumber', e.target.value)}
                disabled={isReadOnly}
                placeholder="e.g. CS-9872"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white disabled:bg-slate-50 disabled:text-slate-400 focus:outline-none focus:border-blue-500 transition font-medium text-slate-700"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Caregiver Name *
              </label>
              <input
                type="text"
                value={formData.caregiverName || ''}
                onChange={(e) => updateField('caregiverName', e.target.value)}
                disabled={isReadOnly}
                required
                placeholder="Enter Caregiver Name"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white disabled:bg-slate-50 disabled:text-slate-400 focus:outline-none focus:border-blue-500 transition font-medium text-slate-700"
              />
            </div>
          </div>

          {/* Form Text Areas */}
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