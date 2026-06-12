import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, Calendar, ShieldCheck, AlertTriangle, 
  FileText, Check, Lock, HelpCircle, Edit2 
} from 'lucide-react';
import { CustomSelect } from '../components/Common/CustomSelect';
import { threatAssessmentService } from '../services/threatAssessmentService';

interface ThreatAssessmentFormData {
  dateStarted: string;
  dateCompleted: string;
  presentDanger: string[];
  presentDangerComments: string;
  impendingDanger: string[];
  impendingDangerComments: string;
  alternativeIntervention: string[];
  alternativeInterventionComments: string;
  safetyThreshold: string;
  isCompleted: boolean;
}

export const ThreatAssessmentFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const isEditMode = !!id;
  const isViewMode = location.state?.mode === 'view';
  
  const [formData, setFormData] = useState<ThreatAssessmentFormData>({
    dateStarted: new Date().toISOString().split('T')[0],
    dateCompleted: '',
    presentDanger: [],
    presentDangerComments: '',
    impendingDanger: [],
    impendingDangerComments: '',
    alternativeIntervention: [],
    alternativeInterventionComments: '',
    safetyThreshold: '',
    isCompleted: false 
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [originalIsCompleted, setOriginalIsCompleted] = useState<boolean>(false);

  // Load data for edit/view mode
  useEffect(() => {
    if (id) {
      const fetchAssessment = async () => {
        try {
          const record = await threatAssessmentService.getAssessmentById(Number(id));
          if (record) {
            const loadedData = {
              dateStarted: record.dateStarted ?? '',
              dateCompleted: record.dateCompleted ?? '',
              presentDanger: record.presentDanger ?? [],
              presentDangerComments: record.presentDangerComments ?? '',
              impendingDanger: record.impendingDanger ?? [],
              impendingDangerComments: record.impendingDangerComments ?? '',
              alternativeIntervention: record.alternativeIntervention ?? [],
              alternativeInterventionComments: record.alternativeInterventionComments ?? '',
              safetyThreshold: record.safetyThreshold ?? '',
              isCompleted: record.isCompleted ?? false,
            };
            setFormData(loadedData);
            setOriginalIsCompleted(record.isCompleted ?? false);
          } else {
            console.error("Record not found");
            navigate('/threat-assessments');
          }
        } catch (error) {
          console.error("Error loading assessment:", error);
        }
      };
      fetchAssessment();
    }
  }, [id, navigate]);

  // Determine if form should be read-only
  const isReadOnly = isViewMode || (isEditMode && originalIsCompleted && !isUnlocking);

  const updateField = (name: keyof ThreatAssessmentFormData, value: any) => {
    if (isReadOnly) return;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;
    
    // Validation: If completed but dateCompleted is empty
    if (formData.isCompleted && !formData.dateCompleted) {
      alert('Please select a completion date before marking as completed.');
      return;
    }
    
    console.log('=== SAVING ASSESSMENT ===');
    console.log('dateCompleted:', formData.dateCompleted);
    console.log('isCompleted:', formData.isCompleted);
    
    setIsSaving(true);
    try {
      // IMPORTANT: Save exactly what's in form, don't clear dateCompleted
      let dataToSave = { ...formData };
      
      // Only clear dateCompleted if NOT completed AND user never set it
      // But if user manually set dateCompleted, keep it even if not completed
      // So we don't clear dateCompleted at all - let user decide
      
      console.log('Data to save:', dataToSave);

      if (isEditMode && id) {
        await threatAssessmentService.updateAssessment(Number(id), dataToSave);
        setOriginalIsCompleted(formData.isCompleted);
      } else {
        const newId = await threatAssessmentService.createAssessment(dataToSave);
        console.log('Created with ID:', newId);
      }
      
      navigate('/threat-assessment');
    } catch (error) {
      console.error("Failed to save:", error);
      alert("Failed to save assessment. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleCheckbox = (arrayName: 'presentDanger' | 'impendingDanger' | 'alternativeIntervention', itemValue: string) => {
    if (isReadOnly) return;
    setFormData(prev => {
      const currentArray = prev[arrayName];
      const updatedArray = currentArray.includes(itemValue)
        ? currentArray.filter(i => i !== itemValue)
        : [...currentArray, itemValue];
      return { ...prev, [arrayName]: updatedArray };
    });
  };

  const handleCompletionToggle = () => {
    if (isReadOnly) return;
    const newCompletedStatus = !formData.isCompleted;
    setFormData(prev => ({
      ...prev,
      isCompleted: newCompletedStatus,
    }));
  };

  const handleUnlockAndEdit = async () => {
    const confirmUnlock = window.confirm(
      'This assessment is currently locked (completed). Do you want to unlock it to make changes?\n\n' +
      'Note: This will mark it as pending again.'
    );
    
    if (confirmUnlock && id) {
      setIsUnlocking(true);
      try {
        await threatAssessmentService.updateAssessment(Number(id), {
          isCompleted: false,
          // Keep the dateCompleted, don't clear it
        });
        
        const record = await threatAssessmentService.getAssessmentById(Number(id));
        if (record) {
          setFormData({
            dateStarted: record.dateStarted ?? '',
            dateCompleted: record.dateCompleted ?? '',
            presentDanger: record.presentDanger ?? [],
            presentDangerComments: record.presentDangerComments ?? '',
            impendingDanger: record.impendingDanger ?? [],
            impendingDangerComments: record.impendingDangerComments ?? '',
            alternativeIntervention: record.alternativeIntervention ?? [],
            alternativeInterventionComments: record.alternativeInterventionComments ?? '',
            safetyThreshold: record.safetyThreshold ?? '',
            isCompleted: false,
          });
          setOriginalIsCompleted(false);
        }
      } catch (error) {
        console.error("Error unlocking assessment:", error);
        alert("Failed to unlock assessment. Please try again.");
      } finally {
        setIsUnlocking(false);
      }
    }
  };

  // ... rest of your arrays (presentDangerCategories, impendingDangerItems, alternativeInterventionItems) remain the same ...

  const presentDangerCategories = [
    { cat: "General", items: ["Severe, extreme maltreatment suspected, observed or confirmed", "Child has multiple or different kinds of injuries", "Child has injuries to face or head", "Maltreatment demonstrates bizarre cruelty", "Maltreatment of several victims suspected, observed or confirmed", "Maltreatment appears premeditated", "Dangerous (life threatening) living arrangements", "Current report represents a serious threat and there is a history of referrals", "Child is accessible to person alleged to have maltreated the child"] },
    { cat: "When considered in the context of the Child", items: ["Parent's viewpoint of child is bizarre", "Child is unable to care for self and unsupervised or alone at time of referral", "Child needs medical attention at time of referral", "Child is profoundly fearful or anxious of home situation at time of referral"] },
    { cat: "When considered in the context of the Parent", items: ["Parent is intoxicated now or consistently under the influence", "Parent is out of control (mental illness or other significant lack of control)", "Parents unable or unwilling to perform basic care", "Parent is acting dangerous now or is described as dangerous", "Parents' whereabouts are unknown", "One or both parents overtly reject intervention", "Both parents/caregivers cannot or do not explain the child's injuries and/or conditions"] },
    { cat: "When considered in the context of the Family", items: ["The family may flee", "The family hides the child", "Child is subject to present/active domestic violence", "Family is isolated and there is a report of serious maltreatment", "Situation may/will change quickly and there is a report of serious maltreatment"] }
  ];

  const impendingDangerItems = [
    "No adult in the home will perform parental duties and responsibilities", "One or both parents are violent", "One or both parents cannot control behavior", "Child is perceived in extremely negative terms by one or both parents/caregivers", "Family does not have resources to meet basic needs", "One or both parents/caregivers fear they will maltreat child and/or request placement", "One or both parents/caregivers intend(ed) to hurt child", "One or both parents/caregivers lack parenting knowledge, skills, or motivation which affects child safety", "There some indication that parents/caregivers will flee", "Child has exceptional needs which the parents/caregivers cannot or will not meet", "Living arrangements seriously endanger child's physical health", "Child shows serious emotional effects of maltreatment and a lack of behavioral control", "Child shows serious physical effects of maltreatment", "Child is fearful of the home situation", "Child is seen by either parent/caregiver as being responsible for parents/caregivers problems", "The maltreating parent/caregiver exhibits no remorse or guilt", "One or both parents/caregivers have failed to benefit from previous professional help"
  ];

  const alternativeInterventionItems = [
    "Failure to provide medical treatment for a non-emergent, minor discomfort, illness for the child.", "Potential safety concerns in and around the home.", "Reoccurring / Ongoing cases of head lice, scabies, etc.", "Sudden decline in child's normal behaviors or displays minor behavioral problems, physical, mental, or social concerns.", "Complaint about child's hygiene have been made by others (school, etc.), child may emit body odor or mouth odor or peers will not play with child.", "Failure to provide adequate clothing, shelter, or nutrition that does not present an immediate safety or health issue to the child.", "Child/Family would benefit from additional resources and might not be receiving such services.", "Family reports trouble accessing resources, supports, etc.", "Family reports insufficient resources and supports resulting in child's well-being concerns."
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6 text-slate-800 pb-16 antialiased p-2">
      
      {/* Header Navigation */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-200/80 pb-5 gap-4">
        <div className="flex items-center gap-4">
          <button 
            type="button"
            onClick={() => navigate('/threat-assessments')} 
            className="p-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 rounded-xl transition-all shadow-2xs active:scale-95"
          >
            <ArrowLeft size={16} strokeWidth={2.5} />
          </button>
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              {isViewMode ? 'View Threat Assessment' : isEditMode ? 'Edit Threat Assessment' : 'Create Threat Assessment'}
            </h2>
            <p className="text-xs font-medium text-slate-500 mt-0.5">
              {isViewMode ? 'Review safety and threat assessment details' : 'Identify and analyze immediate safety, environmental and behavioral threat modules.'}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {isEditMode && originalIsCompleted && !isViewMode && (
            <button
              type="button"
              onClick={handleUnlockAndEdit}
              disabled={isUnlocking}
              className="flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200/60 px-3.5 py-2 rounded-full shadow-2xs hover:bg-amber-100 transition disabled:opacity-50"
            >
              <Edit2 size={14} /> {isUnlocking ? 'Unlocking...' : 'Unlock & Edit'}
            </button>
          )}
          
          {originalIsCompleted && !isViewMode && !isUnlocking && (
            <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-3.5 py-2 rounded-full shadow-2xs">
              <Lock size={14} /> Completed & Locked
            </span>
          )}
          
          {isViewMode && (
            <span className="flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200/60 px-3.5 py-2 rounded-full shadow-2xs">
              <Lock size={14} /> View Only Mode
            </span>
          )}
        </div>
      </div>

      {isEditMode && originalIsCompleted && !isViewMode && !isUnlocking && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-2">
          <Lock size={14} className="text-amber-600" />
          <p className="text-xs text-amber-700">
            This assessment is locked because it's marked as completed. Click "Unlock & Edit" to make changes.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-slate-50/60 rounded-2xl p-2 sm:p-4 space-y-6">
        
        {/* Date Section */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/70 shadow-xs grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Calendar size={13} className="text-slate-400" /> Date Threat Assessment Started *
            </label>
            <input 
              type="date" 
              value={formData.dateStarted} 
              onChange={(e) => updateField('dateStarted', e.target.value)} 
              disabled={isReadOnly}
              required
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white disabled:bg-slate-100/80 disabled:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 font-medium transition shadow-2xs text-slate-700"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Calendar size={13} className="text-slate-400" /> Date Threat Assessment Completed
            </label>
            <input 
              type="date" 
              value={formData.dateCompleted} 
              onChange={(e) => updateField('dateCompleted', e.target.value)}
              disabled={isReadOnly}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white disabled:bg-slate-100/80 disabled:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 font-medium transition shadow-2xs text-slate-700"
            />
            {formData.dateCompleted && (
              <p className="text-[10px] text-blue-500 mt-1 flex items-center gap-1">
                <Calendar size={10} /> Selected: {formData.dateCompleted}
              </p>
            )}
            {formData.isCompleted && (
              <p className="text-[10px] text-emerald-600 mt-1 flex items-center gap-1">
                <Check size={10} /> Assessment will be locked when saved
              </p>
            )}
          </div>
        </div>

        {/* Rest of your form sections remain the same */}
        {/* Present Danger Section */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/70 shadow-xs space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5 text-red-700 font-extrabold text-xs tracking-wider uppercase">
            <div className="p-1 bg-red-50 rounded-md"><AlertTriangle size={14} /></div>
            <span>Present Danger Threats Section</span>
          </div>

          <div className="space-y-5 text-xs">
            {presentDangerCategories.map((subCat) => (
              <div key={subCat.cat} className="space-y-2">
                <h4 className="font-extrabold text-slate-400 text-[10px] uppercase tracking-wider mb-1.5">{subCat.cat}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {subCat.items.map(item => (
                    <label key={item} className={`flex items-start gap-2.5 p-2 border rounded-xl transition font-medium text-slate-700 ${formData.presentDanger.includes(item) ? 'bg-red-50/50 border-red-200' : 'bg-slate-50/40 border-slate-100 hover:bg-slate-50'}`}>
                      <input 
                        type="checkbox" 
                        disabled={isReadOnly} 
                        checked={formData.presentDanger.includes(item)} 
                        onChange={() => handleToggleCheckbox('presentDanger', item)} 
                        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-red-600 accent-red-600 disabled:opacity-60" 
                      />
                      <span className="leading-tight">{item}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <FileText size={13} className="text-slate-400" /> Present Danger Comments
            </label>
            <textarea 
              value={formData.presentDangerComments} 
              onChange={(e) => updateField('presentDangerComments', e.target.value)} 
              disabled={isReadOnly} 
              rows={3} 
              placeholder="Provide situational analysis context for present danger threats..." 
              className="w-full px-4 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-blue-500 font-medium transition shadow-2xs resize-none disabled:bg-slate-100/80" 
            />
          </div>
        </div>

        {/* Impending Danger Section */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/70 shadow-xs space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5 text-orange-700 font-extrabold text-xs tracking-wider uppercase">
            <div className="p-1 bg-orange-50 rounded-md"><ShieldCheck size={14} /></div>
            <span>Impending Danger Threats Section</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
            {impendingDangerItems.map(item => (
              <label key={item} className={`flex items-start gap-2.5 p-2 border rounded-xl transition font-medium text-slate-700 ${formData.impendingDanger.includes(item) ? 'bg-orange-50/50 border-orange-200' : 'bg-slate-50/40 border-slate-100 hover:bg-slate-50'}`}>
                <input 
                  type="checkbox" 
                  disabled={isReadOnly} 
                  checked={formData.impendingDanger.includes(item)} 
                  onChange={() => handleToggleCheckbox('impendingDanger', item)} 
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-orange-600 accent-orange-600 disabled:opacity-60" 
                />
                <span className="leading-tight">{item}</span>
              </label>
            ))}
          </div>

          <div className="pt-2">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <FileText size={13} className="text-slate-400" /> Impending Danger Comments
            </label>
            <textarea 
              value={formData.impendingDangerComments} 
              onChange={(e) => updateField('impendingDangerComments', e.target.value)} 
              disabled={isReadOnly} 
              rows={3} 
              placeholder="Provide situational analysis context for impending danger threats..." 
              className="w-full px-4 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-blue-500 font-medium transition shadow-2xs resize-none disabled:bg-slate-100/80" 
            />
          </div>
        </div>

        {/* Alternative Intervention Section */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/70 shadow-xs space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5 text-blue-700 font-extrabold text-xs tracking-wider uppercase">
            <div className="p-1 bg-blue-50 rounded-md"><HelpCircle size={14} /></div>
            <span>Alternative Intervention Section</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
            {alternativeInterventionItems.map(item => (
              <label key={item} className={`flex items-start gap-2.5 p-2 border rounded-xl transition font-medium text-slate-700 ${formData.alternativeIntervention.includes(item) ? 'bg-blue-50/50 border-blue-200' : 'bg-slate-50/40 border-slate-100 hover:bg-slate-50'}`}>
                <input 
                  type="checkbox" 
                  disabled={isReadOnly} 
                  checked={formData.alternativeIntervention.includes(item)} 
                  onChange={() => handleToggleCheckbox('alternativeIntervention', item)} 
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 accent-blue-600 disabled:opacity-60" 
                />
                <span className="leading-tight">{item}</span>
              </label>
            ))}
          </div>

          <div className="pt-2">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <FileText size={13} className="text-slate-400" /> Alternative Intervention Comments
            </label>
            <textarea 
              value={formData.alternativeInterventionComments} 
              onChange={(e) => updateField('alternativeInterventionComments', e.target.value)} 
              disabled={isReadOnly} 
              rows={3} 
              placeholder="Provide analysis notes on resource needs or minor health/behavior concerns..." 
              className="w-full px-4 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-blue-500 font-medium transition shadow-2xs resize-none disabled:bg-slate-100/80" 
            />
          </div>
        </div>

        {/* Safety Threshold Dropdown */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/70 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5 text-slate-700 font-extrabold text-xs tracking-wider uppercase">
            <div className="p-1 bg-slate-100 rounded-md"><ShieldCheck size={14} /></div>
            <span>Decision Governance Matrix</span>
          </div>
          <div className="w-full md:w-1/2">
            <label className="block text-[11px] font-bold text-slate-600 tracking-wide mb-1.5">Safety Threshold *</label>
            <CustomSelect 
              value={formData.safetyThreshold}
              placeholder="Select Option"
              options={[
                { value: 'Safe', label: 'Safe' },
                { value: 'Conditionally Safe', label: 'Conditionally Safe' },
                { value: 'Unsafe', label: 'Unsafe' },
                { value: 'Adult', label: 'Out Of Control: No Adult In Household' },
                { value: 'Behaviors', label: 'Behaviors, Conditions Are Specific' }
              ]}
              onChange={(val) => updateField('safetyThreshold', val)}
              disabled={isReadOnly}
            />
          </div>
        </div>

        {/* Completion Checkbox */}
        {!isViewMode && (!originalIsCompleted || isUnlocking) && (
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/70 shadow-xs space-y-3">
            <div 
              onClick={handleCompletionToggle}
              className={`flex items-start gap-4 bg-slate-50/50 border p-4 rounded-xl select-none transition-all group ${
                isReadOnly ? 'cursor-not-allowed opacity-70' : 'cursor-pointer hover:bg-slate-50 border-slate-200/50'
              }`}
            >
              <div className="relative flex items-center justify-center w-5 h-5 mt-0.5 shrink-0">
                <input 
                  type="checkbox" 
                  checked={formData.isCompleted} 
                  readOnly
                  className="sr-only" 
                />
                <div className={`w-5 h-5 bg-white border rounded-md flex items-center justify-center transition-all shadow-3xs ${
                  formData.isCompleted 
                    ? 'border-emerald-600 bg-emerald-50' 
                    : 'border-slate-300 group-hover:border-slate-400'
                }`}>
                  {formData.isCompleted && (
                    <Check size={14} strokeWidth={3} className="text-emerald-600" />
                  )}
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Lock size={13} className="text-slate-400" /> 
                  {formData.isCompleted ? 'Assessment Completed & Locked' : 'Mark as Completed (Lock Assessment)'}
                </span>
                <span className="text-[10px] font-medium text-slate-400/90 mt-0.5">
                  {formData.isCompleted 
                    ? 'This assessment will be locked when saved. No further changes can be made.' 
                    : 'Once marked as completed, the assessment will be locked and become read-only.'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {!isViewMode && (
          <div className="flex justify-end items-center gap-3 pt-5 border-t border-slate-200/80">
            <button 
              type="button" 
              onClick={() => navigate('/threat-assessments')} 
              className="px-5 py-2.5 border border-slate-200 text-slate-700 rounded-xl bg-white hover:bg-slate-50 text-xs font-bold shadow-2xs transition-all active:scale-95"
            >
              Cancel
            </button>
            
            <button 
              type="submit" 
              disabled={isSaving || (isEditMode && originalIsCompleted && !isUnlocking)}
              className={`px-6 py-2.5 rounded-xl text-xs font-bold text-white shadow-md transition-all active:scale-95 ${
                isSaving ? 'bg-slate-400 cursor-wait' :
                (isEditMode && originalIsCompleted && !isUnlocking) 
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-600/10'
              }`}
            >
              {isSaving ? 'Saving...' : (isEditMode ? 'Save Changes' : 'Create Assessment')}
            </button>
          </div>
        )}

        {isViewMode && (
          <div className="flex justify-end">
            <button 
              type="button" 
              onClick={() => navigate('/threat-assessment')} 
              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-slate-600 text-white hover:bg-slate-700 transition"
            >
              Back to List
            </button>
          </div>
        )}
      </form>
    </div>
  );
};