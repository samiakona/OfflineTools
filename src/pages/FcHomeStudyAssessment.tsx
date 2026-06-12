import React, { useState, useMemo } from 'react';
import { Calendar, Clock, Search, ChevronDown, ShieldCheck, Check, Save, X, FileText } from 'lucide-react';

// Sample Caregivers Data
const CAREGIVER_OPTIONS = [
  { id: '1', name: 'Rahima Khatun' },
  { id: '2', name: 'Abdul Karim' },
  { id: '3', name: 'John Doe' },
  { id: '4', name: 'Sarah Smith' },
  { id: '5', name: 'Hasan Mahmud' },
];

// Generate Time Options for Dropdown (12-hour format with 30-minute intervals)
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

interface AssessmentFormData {
  assessmentDate: string;
  assessmentTime: string;
  caregiverId: string;
  caregiverName: string;
  contacts: string;
  sourceOfReferral: string;
  directionsToHome: string;
  motivationForTakingChild: string;
  
  // Family History
  bornAndRaised: string;
  parentsDetails: string;
  siblingsDetails: string;
  siblingsRelationship: string;
  howRaised: string;
  conflictResolution: string;
  familyActivities: string;
  
  // Self Description
  selfDescription: string;
  strengthsWeaknesses: string;
  dealWithStress: string;
  thingsUpsetYou: string;
  
  // Education
  highSchool: string;
  importanceOfEducation: string;
  newParentingSkills: string;
  
  // Work Experience
  currentOccupation: string;
  careerPlans: string;
  workExperiencePrep: string;
  
  // Children
  describeChildren: string;
  treatFosterChild: string;
  
  // Parenting
  parentWellThings: string;
  parentImproveThings: string;
  parentUpsetThings: string;
  experiencesInsideHome: string;
  familyRules: string;
  
  // Discipline
  disciplineOwnChildren: string;
  physicalDisciplineThoughts: string;
  
  // Chemical Use
  chemicalUseDescription: string;
  acceptableAlcoholUse: string;
  familyChemicalProblem: string;
  
  // Ethical and Spiritual
  spiritualityCultureRole: string;
  childBeliefsDiffer: string;
  childPersonalBeliefsDiffer: string;
  
  // Finances
  moneyHandled: string;
  financialPicture: string;
  
  isCompleted: boolean;
}

const FcHomeStudyAssessment: React.FC = () => {
  const [formData, setFormData] = useState<AssessmentFormData>({
    assessmentDate: new Date().toISOString().split('T')[0],
    assessmentTime: '10:00 AM', // Updated to match dropdown format
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
  });

  // Caregiver Dropdown States
  const [searchQuery, setSearchQuery] = useState('');
  const [isCaregiverDropdownOpen, setIsCaregiverDropdownOpen] = useState(false);
  
  // Time Dropdown State
  const [isTimeDropdownOpen, setIsTimeDropdownOpen] = useState(false);

  const filteredCaregivers = useMemo(() => {
    return CAREGIVER_OPTIONS.filter(c =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const updateField = (name: keyof AssessmentFormData, value: any) => {
    if (formData.isCompleted) return; // Prevent edits if completed
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectCaregiver = (id: string, name: string) => {
    updateField('caregiverId', id);
    updateField('caregiverName', name);
    setIsCaregiverDropdownOpen(false);
    setSearchQuery('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('💾 Saving Home Study Assessment Data:', formData);
    alert('✅ Assessment Saved Successfully!');
  };

  const isReadOnly = formData.isCompleted;

  // Custom Subsection Container Component
  const FormSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/70 shadow-2xs space-y-4">
      <div className="text-blue-700 font-extrabold text-sm tracking-wider uppercase border-b border-slate-100 pb-2 mb-2">
        {title}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">{children}</div>
    </div>
  );

  // Custom Textarea Input Component
  const FormTextArea = ({ label, field }: { label: string; field: keyof AssessmentFormData }) => (
    <div className="flex flex-col space-y-1.5">
      <label className="text-xs font-bold text-slate-700">{label}</label>
      <textarea
        value={formData[field] as string}
        onChange={(e) => updateField(field, e.target.value)}
        disabled={isReadOnly}
        rows={3}
        className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 resize-none text-sm bg-white text-slate-800 placeholder-slate-400 font-medium transition disabled:bg-slate-50 disabled:text-slate-400"
        placeholder="Type response here..."
      />
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6 text-slate-800 pb-16 antialiased p-2">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-200/80 pb-5 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
            <FileText size={22} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Home Study Assessment Form</h2>
            <p className="text-xs font-medium text-slate-500 mt-0.5">Complete full documentation for foster care assessment.</p>
          </div>
        </div>

        {isReadOnly && (
          <span className="flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200/60 px-3.5 py-2 rounded-full shadow-2xs animate-pulse">
            <ShieldCheck size={14} /> Locked Document (Read-Only)
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="bg-slate-50/60 rounded-2xl p-2 sm:p-4 space-y-6">
        
        {/* Basic Meta Fields */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/70 shadow-2xs grid grid-cols-1 md:grid-cols-4 gap-5">
          {/* Assessment Date */}
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

          {/* Assessment Time - Replaced with Dropdown */}
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

            {/* Time Options Dropdown */}
            {isTimeDropdownOpen && (
              <div className="absolute z-30 w-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg max-h-56 overflow-y-auto p-1 animate-in fade-in duration-100">
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

          {/* Caregiver - Searchable Dropdown */}
          <div className="relative md:col-span-2">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              Caregiver *
            </label>
            <div 
              onClick={() => !isReadOnly && setIsCaregiverDropdownOpen(!isCaregiverDropdownOpen)}
              className={`w-full px-4 py-2 text-sm border border-slate-200 rounded-xl bg-white flex items-center justify-between font-medium text-slate-700 cursor-pointer ${isReadOnly ? 'bg-slate-50 text-slate-400 cursor-not-allowed' : ''}`}
            >
              <span className={formData.caregiverName ? 'text-slate-800' : 'text-slate-400'}>
                {formData.caregiverName || 'Select Caregiver...'}
              </span>
              <ChevronDown size={16} className="text-slate-400" />
            </div>

            {/* Dropdown Menu Overlay */}
            {isCaregiverDropdownOpen && (
              <div className="absolute z-30 w-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg p-2 space-y-2 animate-in fade-in duration-100">
                <div className="relative flex items-center">
                  <Search size={14} className="absolute left-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search caregiver..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-100 rounded-lg bg-slate-50/50 focus:outline-none focus:border-blue-500 font-medium"
                  />
                </div>
                <div className="max-h-40 overflow-y-auto space-y-0.5 custom-scrollbar">
                  {filteredCaregivers.length > 0 ? (
                    filteredCaregivers.map((caregiver) => (
                      <div
                        key={caregiver.id}
                        onClick={() => handleSelectCaregiver(caregiver.id, caregiver.name)}
                        className={`px-3 py-2 text-xs font-medium rounded-lg cursor-pointer hover:bg-blue-50 hover:text-blue-600 transition ${formData.caregiverId === caregiver.id ? 'bg-blue-50 text-blue-600' : 'text-slate-700'}`}
                      >
                        {caregiver.name}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-3 text-[11px] text-slate-400">No caregiver found</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Primary Contact & Info */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/70 shadow-2xs space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FormTextArea label="Contacts" field="contacts" />
            <FormTextArea label="Source of Referral" field="sourceOfReferral" />
            <FormTextArea label="Directions to Home" field="directionsToHome" />
            <FormTextArea label="Motivation for Taking Child" field="motivationForTakingChild" />
          </div>
        </div>

        {/* FAMILY HISTORY Section */}
        <FormSection title="Family History">
          <FormTextArea label="Where were you born and raised?" field="bornAndRaised" />
          <FormTextArea label="What are your parents’ names, where do they live, and briefly describe your relationship with them?" field="parentsDetails" />
          <FormTextArea label="What are your siblings’ names, ages, and occupation?" field="siblingsDetails" />
          <FormTextArea label="Describe your relationship with your siblings growing up." field="siblingsRelationship" />
          <FormTextArea label="How were you raised as a child?" field="howRaised" />
          <FormTextArea label="How did your family resolve conflict?" field="conflictResolution" />
          <FormTextArea label="What types of activities did you do as a family?" field="familyActivities" />
        </FormSection>

        {/* SELF-DESCRIPTION Section */}
        <FormSection title="Self-Description">
          <FormTextArea label="How would you describe yourself?" field="selfDescription" />
          <FormTextArea label="What are your strengths? Weaknesses?" field="strengthsWeaknesses" />
          <FormTextArea label="How do you deal with stress?" field="dealWithStress" />
          <FormTextArea label="What types of things upset you?" field="thingsUpsetYou" />
        </FormSection>

        {/* EDUCATION Section */}
        <FormSection title="Education">
          <FormTextArea label="Where did you attend high school?" field="highSchool" />
          <FormTextArea label="How do you view your importance of education?" field="importanceOfEducation" />
          <FormTextArea label="How do you feel about learning new parenting skills and will you make yourself available to mandatory trainings?" field="newParentingSkills" />
        </FormSection>

        {/* WORK EXPERIENCE Section */}
        <FormSection title="Work Experience">
          <FormTextArea label="What is your current occupation and work schedule?" field="currentOccupation" />
          <FormTextArea label="What are your career plans or anticipated changes?" field="careerPlans" />
          <FormTextArea label="Have you had work experience that has prepared you for foster care?" field="workExperiencePrep" />
        </FormSection>

        {/* CHILDREN Section */}
        <FormSection title="Children">
          <FormTextArea label="Describe your children? (Names and ages)" field="describeChildren" />
          <FormTextArea label="Can you treat a foster child as a member of your own family?" field="treatFosterChild" />
        </FormSection>

        {/* PARENTING Section */}
        <FormSection title="Parenting">
          <FormTextArea label="Name some of the things that you do well as a parent?" field="parentWellThings" />
          <FormTextArea label="What things could you improve on?" field="parentImproveThings" />
          <FormTextArea label="What things upset you as a parent?" field="parentUpsetThings" />
          <FormTextArea label="What types of experiences have you dealt with your children inside your home?" field="experiencesInsideHome" />
          <FormTextArea label="Describe the family’s rules, house rules, and curfew." field="familyRules" />
        </FormSection>

        {/* DISCIPLINE Section */}
        <FormSection title="Discipline">
          <FormTextArea label="How do you discipline your own children?" field="disciplineOwnChildren" />
          <FormTextArea label="What are your thoughts on physical discipline?" field="physicalDisciplineThoughts" />
        </FormSection>

        {/* CHEMICAL USE Section */}
        <FormSection title="Chemical Use">
          <FormTextArea label="Describe your use of alcohol/mood altering drugs?" field="chemicalUseDescription" />
          <FormTextArea label="What do you see as acceptable use of alcohol in the family?" field="acceptableAlcoholUse" />
          <FormTextArea label="Has there ever been a problem with anyone in your close or extended family?" field="familyChemicalProblem" />
        </FormSection>

        {/* ETHICAL AND SPIRITUAL BELIEFS Section */}
        <FormSection title="Ethical and Spiritual Beliefs">
          <FormTextArea label="What role do your spirituality/culture play in your life?" field="spiritualityCultureRole" />
          <FormTextArea label="What if a child’s beliefs differ from your own?" field="childBeliefsDiffer" />
          <FormTextArea label="What if a child’s personal beliefs differ from your own?" field="childPersonalBeliefsDiffer" />
        </FormSection>

        {/* FINANCES Section */}
        <FormSection title="Finances">
          <FormTextArea label="How is money handled? How are financial decisions decided in your family’s?" field="moneyHandled" />
          <FormTextArea label="Describe your future and present financial picture?" field="financialPicture" />
        </FormSection>

        {/* Lock / Completion Checkbox */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/70 shadow-2xs">
          <div 
            onClick={() => !isReadOnly && updateField('isCompleted', !formData.isCompleted)}
            className={`flex items-start gap-4 bg-slate-50/50 hover:bg-slate-50 border border-slate-200/50 p-4 rounded-xl select-none transition-all group ${isReadOnly ? 'cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <div className="relative flex items-center justify-center w-5 h-5 mt-0.5 shrink-0">
              <input 
                type="checkbox" 
                checked={formData.isCompleted} 
                readOnly
                className="sr-only" 
              />
              <div className={`w-5 h-5 bg-white border rounded-md flex items-center justify-center transition-all shadow-3xs group-hover:border-slate-400 ${formData.isCompleted ? 'border-emerald-600' : 'border-slate-300'}`}>
                {formData.isCompleted && (
                  <Check size={14} strokeWidth={3} className="text-emerald-600 animate-in zoom-in-75 duration-100" />
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

        {/* Bottom Form Actions */}
        <div className="flex justify-end items-center gap-3 pt-5 border-t border-slate-200/80">
          <button 
            type="button" 
            onClick={() => alert('Cancelled!')} 
            className="flex items-center gap-1.5 px-5 py-2.5 border border-slate-200 text-slate-700 rounded-xl bg-white hover:bg-slate-50 text-xs font-bold shadow-2xs transition-all active:scale-95"
          >
            <X size={14} /> Cancel
          </button>
          {!isReadOnly && (
            <button 
              type="submit" 
              className="flex items-center gap-1.5 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/10 transition-all active:scale-95"
            >
              <Save size={14} /> Save Assessment
            </button>
          )}
        </div>

      </form>
    </div>
  );
};

export default FcHomeStudyAssessment;