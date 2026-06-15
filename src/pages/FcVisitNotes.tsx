import React, { useState, useEffect } from 'react';
import { 
  Calendar, Clock, ShieldCheck, Check, Save, X, List, Plus, Edit2, 
  Eye, Trash2, CloudLightning, ChevronDown, User, FileEdit, Hash, AlertCircle 
} from 'lucide-react';
import { visitNotesService } from '../services/visitNotesService';
import type { VisitNotesData } from '../types/visitNotes';

const APPOINTMENT_TYPES = [
  'Email', 'Face to Face', 'letter', 'N/A', 
  'Note to file', 'phone', 'Stuffing', 'Text', 'Virtual'
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

const INITIAL_FORM_STATE: VisitNotesData = {
  date: new Date().toISOString().split('T')[0],
  time: '10:00 AM',
  caseNumber: '',
  children: '',
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
};

// --- Form Sub-components for Reusability ---
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

const FcVisitNotes: React.FC = () => {
  const [viewMode, setViewMode] = useState<'form' | 'list'>('list');
  const [notesList, setNotesList] = useState<VisitNotesData[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<VisitNotesData>(INITIAL_FORM_STATE);
  
  const [isTimeDropdownOpen, setIsTimeDropdownOpen] = useState(false);
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);

  const loadList = async () => {
    const list = await visitNotesService.getAll();
    setNotesList(list);
  };

  useEffect(() => {
    loadList();
  }, []);

  const updateField = (name: keyof VisitNotesData, value: any) => {
    if (formData.isCompleted && name !== 'isCompleted') return;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e?: React.FormEvent, updatedData?: VisitNotesData) => {
    if (e) e.preventDefault();
    const dataToSave = updatedData || formData;

    if (!dataToSave.children) {
      alert('❌ Children field is required!');
      return;
    }

    try {
      if (editingId) {
        await visitNotesService.update(editingId, dataToSave);
        alert(dataToSave.isCompleted ? '🔒 Visit Notes Completed & Locked!' : '✅ Visit Notes Updated in Offline Storage!');
      } else {
        await visitNotesService.create(dataToSave);
        alert(dataToSave.isCompleted ? '🔒 New Visit Notes Saved & Locked!' : '✅ New Visit Notes Saved Offline!');
      }
      handleCancel();
      await loadList();
    } catch (error) {
      console.error(error);
      alert('❌ Failed to save data to IndexedDB.');
    }
  };

  const handleToggleComplete = async () => {
    if (formData.isCompleted) return;

    if (window.confirm('Are you sure you want to mark this visit note as completed? This will lock the record permanently.')) {
      const updatedState = { ...formData, isCompleted: true };
      setFormData(updatedState);
      await handleSubmit(undefined, updatedState);
    }
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this record from offline database?')) {
      await visitNotesService.delete(id);
      alert('🗑️ Record Deleted Successfully!');
      await loadList();
    }
  };

  const handlePushSingleData = async (item: VisitNotesData, e: React.MouseEvent) => {
    e.stopPropagation();
    alert(`⚡ Syncing Visit Notes for Case #${item.caseNumber || 'N/A'} to the server...`);
  };

  const handlePushAllData = () => {
    if (notesList.length === 0) {
      alert('⚠️ No offline data available to push.');
      return;
    }
    alert(`⚡ Syncing total ${notesList.length} records to the server...`);
  };

  const handleClearAllData = async () => {
    if (window.confirm('⚠️ CRITICAL WARNING!\nThis will delete ALL visit notes from IndexedDB. Are you sure?')) {
      await visitNotesService.clearAll();
      alert('💥 All offline visit notes cleared.');
      await loadList();
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
  };

  const isReadOnly = formData.isCompleted;

  return (
    // কন্টেইনার উইডথ max-w-5xl থেকে বাড়িয়ে max-w-7xl করা হলো যাতে টেবিল ছড়াতে পারে
    <div className="max-w-7xl mx-auto space-y-6 text-slate-800 pb-16 antialiased p-4">
      
      {/* Header Panel */}
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

        {/* Global Action Triggers */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
          {viewMode === 'list' ? (
            <>
              <button
                type="button"
                onClick={handlePushAllData}
                className="flex items-center gap-1.5 bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white px-3 py-2 rounded-xl text-xs font-semibold transition shadow-2xs cursor-pointer"
              >
                <CloudLightning size={14} /> 
                <span>Push All Data</span>
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

      {/* --- TABLE VIEW COMPONENT --- */}
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
            /* রেসপন্সিভ মেকানিজম: বড় স্ক্রিনে ফুল উইডথ নিবে এবং ছোট স্ক্রিনে ডাটা না ভেঙে স্ক্রোল হবে */
            <div className="w-full overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[1100px] lg:min-w-full table-auto">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-200/60 text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                    {/* উইডথ ও নো-র‌্যাপ প্রোপার্টি দিয়ে ফিল্ড নেম ব্রেকিং ফিক্স করা হয়েছে */}
                    <th className="py-4 px-5 w-[20%] min-w-[180px]">Children</th>
                    <th className="py-4 px-4 w-[12%] min-w-[110px]">Case Number</th>
                    <th className="py-4 px-4 w-[28%] min-w-[260px]">Concerns / Appointments</th>
                    <th className="py-4 px-4 w-[15%] min-w-[150px]">Appointment Type</th>
                    <th className="py-4 px-4 w-[13%] min-w-[130px]">Date & Time</th>
                    <th className="py-4 px-4 text-center w-[12%] min-w-[100px]">Status</th>
                    <th className="py-4 px-5 text-right w-[140px] min-w-[140px]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {notesList.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/40 transition-all">
                      {/* Children */}
                      <td className="py-3.5 px-5 font-bold text-slate-900">
                        <div className="flex items-center gap-2">
                          <User size={14} className="text-slate-400 shrink-0" />
                          <span className="truncate block max-w-[180px]" title={item.children}>
                            {item.children || 'Not Specified'}
                          </span>
                        </div>
                      </td>

                      {/* Case Number */}
                      <td className="py-3.5 px-4 font-semibold text-slate-600">
                        {item.caseNumber ? (
                          <span className="inline-flex items-center px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-xs font-mono">
                            {item.caseNumber}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs italic">N/A</span>
                        )}
                      </td>

                      {/* Concerns / Appointments */}
                      <td className="py-3.5 px-4 text-slate-600 font-medium">
                        {item.concernsAppointments ? (
                          <div className="flex items-center gap-1.5" title={item.concernsAppointments}>
                            <AlertCircle size={13} className="text-amber-500 shrink-0" />
                            <span className="block break-words line-clamp-2 text-xs sm:text-sm">
                              {item.concernsAppointments}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs italic">No concerns listed</span>
                        )}
                      </td>

                      {/* Appointment Type */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md text-xs font-medium border border-blue-100">
                          {item.appointmentType}
                        </span>
                      </td>

                      {/* Date & Time */}
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

                      {/* Status */}
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

                      {/* Actions */}
                      <td className="py-3.5 px-5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => handlePushSingleData(item, e)}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50/60 text-blue-600 border border-blue-200 rounded-lg text-xs font-semibold shadow-3xs cursor-pointer"
                          >
                            <CloudLightning size={12} />
                            <span>Push</span>
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
                            onClick={(e) => item.id && handleDelete(item.id, e)}
                            className="inline-flex items-center p-1 bg-white border border-slate-200 text-slate-400 hover:text-red-600 rounded-lg shadow-3xs cursor-pointer"
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

      {/* --- DATA ASSESSMENT FORM VIEW --- */}
      {viewMode === 'form' && (
        <form onSubmit={(e) => handleSubmit(e)} className="bg-slate-50/60 rounded-2xl p-2 sm:p-4 space-y-6">
          {isReadOnly && (
            <div className="flex items-center gap-2 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200/60 p-4 rounded-xl shadow-2xs">
              <ShieldCheck size={16} className="animate-pulse" /> This document is locked (Read-Only). Changes cannot be saved.
            </div>
          )}

          {/* Core Master Meta Parameters */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/70 shadow-2xs grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-5">
            {/* Field: Date */}
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

            {/* Field: Time Dropdown */}
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

            {/* Field: Case Number */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Hash size={13} className="text-slate-400" /> Case Number
              </label>
              <input
                type="text"
                value={formData.caseNumber}
                onChange={(e) => updateField('caseNumber', e.target.value)}
                disabled={isReadOnly}
                placeholder="e.g. C-8912"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white disabled:bg-slate-50 disabled:text-slate-400 focus:outline-none focus:border-blue-500 transition font-medium text-slate-700"
              />
            </div>

            {/* Field: Children */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Children *
              </label>
              <input
                type="text"
                value={formData.children}
                onChange={(e) => updateField('children', e.target.value)}
                disabled={isReadOnly}
                required
                placeholder="Enter children names"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white disabled:bg-slate-50 disabled:text-slate-400 focus:outline-none focus:border-blue-500 transition font-medium text-slate-700"
              />
            </div>

            {/* Field: Appointment Type Dropdown */}
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
          </div>

          {/* Field: Concerns/Appointments Line Element */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/70 shadow-2xs">
            <div className="flex flex-col space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Concerns / Appointments</label>
              <input
                type="text"
                value={formData.concernsAppointments}
                onChange={(e) => updateField('concernsAppointments', e.target.value)}
                disabled={isReadOnly}
                placeholder="Enter concerns or appointment notes"
                className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-sm font-medium transition disabled:bg-slate-50 text-slate-800"
              />
            </div>
          </div>

          {/* Section 1: Development Metrics */}
          <FormSection title="Program, Activities & Development">
            <FormTextArea label="Baby/Toddler programs enrolled in, growth, & development" field="babyProgramsGrowth" formData={formData} isReadOnly={isReadOnly} updateField={updateField} />
            <FormTextArea label="School Activities" field="schoolActivities" formData={formData} isReadOnly={isReadOnly} updateField={updateField} />
            <FormTextArea label="16 & older: independent living skills, working, driving classes, activities" field="independentLivingSkills" formData={formData} isReadOnly={isReadOnly} updateField={updateField} />
            <FormTextArea label="Purchases for child, such as clothing, diapers, etc. (amount should reflect $75/month): Receipts" field="purchasesForChild" formData={formData} isReadOnly={isReadOnly} updateField={updateField} />
          </FormSection>

          {/* Section 2: Summarized Logs */}
          <FormSection title="Visits & Behavior Assessment">
            <FormTextArea label="Family Visits, dates with Summary" field="familyVisitsSummary" formData={formData} isReadOnly={isReadOnly} updateField={updateField} />
            <FormTextArea label="Child Issues, behaviors, concerns, comments" field="childIssuesBehaviors" formData={formData} isReadOnly={isReadOnly} updateField={updateField} />
          </FormSection>

          {/* Section 3: Checkbox Environmental Matrix */}
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

          {/* Section 4: Home Logistics */}
          <FormSection title="Home Environment & Logistics">
            <FormTextArea label="Where do the children sleep?" field="childrenSleepLocation" formData={formData} isReadOnly={isReadOnly} updateField={updateField} />
            <FormTextArea label="Where are medications stored?" field="medicationsStorage" formData={formData} isReadOnly={isReadOnly} updateField={updateField} />
            <FormTextArea label="Where are cleaners stored?" field="cleanersStorage" formData={formData} isReadOnly={isReadOnly} updateField={updateField} />
            <FormTextArea label="Phone numbers and email address up to date?" field="contactInfoUpToDate" formData={formData} isReadOnly={isReadOnly} updateField={updateField} />
          </FormSection>

          {/* Section 5: Signature Node */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/70 shadow-2xs space-y-5">
            <FormTextArea label="Additional Comments" field="additionalComments" formData={formData} isReadOnly={isReadOnly} updateField={updateField} />
            
            <div className="flex flex-col space-y-1.5 md:w-1/2 pt-2">
              <label className="text-xs font-bold text-slate-700">Foster Care Assistant Signature *</label>
              <input
                type="text"
                value={formData.fosterCareAssistantSignature}
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

          {/* Form Control Triggers */}
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