import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, Calendar, ShieldCheck, Home, 
  User, AlertTriangle, FileText, Check, Lock, Hash 
} from 'lucide-react';
import { CustomSelect } from '../components/Common/CustomSelect';
import { assessmentService } from '../services/assessmentService';
import type { AssessmentFormData } from '../types/assessment';

export const AssessmentFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>(); // URL থেকে ID নেওয়ার জন্য
  const isEditMode = !!id;

  const [formData, setFormData] = useState<AssessmentFormData & { caseNumber?: string }>({
    caseNumber: '', // 👈 নতুন Case Number স্টেট (কোনো পুরাতন ডেটা রিমুভ করা হয়নি)
    dateStarted: new Date().toISOString().split('T')[0],
    dateCompleted: '',
    name: '',
    relationship: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    county: '',
    hasHomeConcerns: 'No',
    weapons: [],
    livingSpace: [],
    sanitation: [],
    chemicals: [],
    substanceUse: [],
    climate: [],
    homeConcernsExplanation: '',
    otherRiskIssues: 'No',
    otherRiskExplanation: '',
    hasPhysicalConcerns: 'No',
    physicalItems: [],
    capacities: [],
    abandonmentText: '',
    isCompleted: false,
     isChildSafeAtHome: true // 👈 এই লাইন যোগ করুন
  });

  // 📥 ইডিট মোড হলে ডেটাবেজ থেকে পুরাতন ডেটা ফর্মে লোড করা
  useEffect(() => {
    if (isEditMode && id) {
      const fetchAssessment = async () => {
        try {
          const record = await assessmentService.getAssessmentById(Number(id));
          if (record) {
            setFormData(record); // ফর্মে পুরাতন ডেটা সেট হয়ে যাবে
          } else {
            console.error("Record not found");
            navigate('/assessments'); // ডেটা না পাওয়া গেলে লিস্ট পেজে ব্যাক করবে
          }
        } catch (error) {
          console.error("Error loading assessment:", error);
        }
      };
      fetchAssessment();
    }
  }, [id, isEditMode, navigate]);

  // যদি আগে থেকেই রেকর্ডটি Completed মার্ক করা থাকে, তবে পুরো ফর্ম Read-Only হবে
  const isReadOnly = formData.isCompleted;

  const updateField = (name: string, value: any) => {
    if (isReadOnly) return; // লকড থাকলে কোনো চেঞ্জ করতে দেবে না
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // 🏁 ফর্ম সাবমিট হ্যান্ডলার (Add এবং Edit দুটিই হ্যান্ডেল করবে)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return; // সেফটি গার্ড

    try {
      // 🌟 name-এর ভ্যালুটাকে নিশ্চিতভাবে caseName হিসেবেও অবজেক্টে পুশ করছি
      const submissionData = {
        ...formData,
        caseName: formData.name // 👈 এই লাইনটিই আপনার টেবিলের নাম আপডেট ফিক্স করবে
      };

      if (isEditMode && id) {
        // ডেটাবেজে আপডেট করার মেথড কল (submissionData পাঠানো হচ্ছে)
        await assessmentService.updateAssessment(Number(id), submissionData);
      } else {
        // নতুন ডেটা সেভ করার মেথড
        await assessmentService.createAssessment(submissionData);
      }
      navigate('/assessments'); // সাকসেস হলে লিস্ট পেজে ব্যাক
    } catch (error) {
      console.error("Failed to save:", error);
    }
  };

  // Smart Checkbox logic with "No Concerns" mutual exclusion
  const handleToggleCheckbox = (arrayName: keyof AssessmentFormData, itemValue: string) => {
    if (isReadOnly) return;
    setFormData(prev => {
      const currentArray = prev[arrayName] as string[];
      let updatedArray: string[];

      if (itemValue === 'No Concerns') {
        updatedArray = currentArray.includes('No Concerns') ? [] : ['No Concerns'];
      } else {
        const filtered = currentArray.filter(i => i !== 'No Concerns');
        updatedArray = filtered.includes(itemValue)
          ? filtered.filter(i => i !== itemValue)
          : [...filtered, itemValue];
      }

      return { ...prev, [arrayName]: updatedArray };
    });
  };

  const isInputDisabled = (arrayName: keyof AssessmentFormData, itemValue: string) => {
    if (isReadOnly) return true;
    const currentArray = formData[arrayName] as string[];
    return currentArray.includes('No Concerns') && itemValue !== 'No Concerns';
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 text-slate-800 pb-16 antialiased p-2">
      
      {/* 🔝 Top Header Navigation */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-200/80 pb-5 gap-4">
        <div className="flex items-center gap-4">
          <button 
            type="button"
            onClick={() => navigate('/assessments')} 
            className="p-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 rounded-xl transition-all shadow-2xs active:scale-95"
          >
            <ArrowLeft size={16} strokeWidth={2.5} />
          </button>
          <div>
            {/* 🌟 ডাইনামিক হেডিং (ইডিট নাকি ক্রিয়েট মোড তার ওপর ভিত্তি করে) */}
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              {isEditMode ? 'Edit Assessment' : 'Create New Assessment'}
            </h2>
            <p className="text-xs font-medium text-slate-500 mt-0.5">
              {isEditMode ? 'Modify specific demographic parameters and safety evaluation modules.' : 'Fill in specific demographic parameters and safety evaluation modules.'}
            </p>
          </div>
        </div>

        {isReadOnly && (
          <span className="flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200/60 px-3.5 py-2 rounded-full shadow-2xs">
            <Lock size={14} /> Locked Asset (Read-Only)
          </span>
        )}
      </div>

      {/* 📦 Form Container */}
      <form onSubmit={handleSubmit} className="bg-slate-50/60 rounded-2xl p-2 sm:p-4 space-y-6">
        
        {/* 📅 Card 1: Logistics & Timestamps (এটিকে ৩টি কলামের গ্রিড করা হয়েছে) */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/70 shadow-xs grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Calendar size={13} className="text-slate-400" /> Date Assessment Started *
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
              <Calendar size={13} className="text-slate-400" /> Date Assessment Completed
            </label>
            <input 
              type="date" 
              value={formData.dateCompleted} 
              onChange={(e) => updateField('dateCompleted', e.target.value)} 
              disabled={isReadOnly}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white disabled:bg-slate-100/80 disabled:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 font-medium transition shadow-2xs text-slate-700"
            />
          </div>

          {/* 🔗 ৩ নম্বর ইনপুট ফিল্ড: Case Number */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Hash size={13} className="text-slate-400" /> Case Number
            </label>
            <input 
              type="text" 
              placeholder="Enter case number"
              value={formData.caseNumber || ''} 
              onChange={(e) => updateField('caseNumber', e.target.value)} 
              disabled={isReadOnly}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white disabled:bg-slate-100/80 disabled:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 font-medium transition shadow-2xs text-slate-700"
            />
          </div>
        </div>
        {/* 👤 Card 2: Demographics Information */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/70 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5 text-blue-700 font-extrabold text-xs tracking-wider uppercase">
            <div className="p-1 bg-blue-50 rounded-md"><User size={14} /></div>
            <span>Demographics Information</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 tracking-wide mb-1.5">Name *</label>
              <input 
                type="text" 
                value={formData.name} 
                onChange={(e) => updateField('name', e.target.value)} 
                disabled={isReadOnly} 
                required 
                placeholder="Full Name" 
                className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 font-medium transition shadow-2xs" 
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 tracking-wide mb-1.5">Relationship *</label>
              <CustomSelect 
                value={formData.relationship}
                placeholder="Select Option"
                options={[
                  { value: 'Mother', label: 'Mother' },
                  { value: 'Father', label: 'Father' },
                  { value: 'Guardian', label: 'Guardian' },
                  { value: 'Other', label: 'Other' }
                ]}
                onChange={(val) => updateField('relationship', val)}
                disabled={isReadOnly}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="md:col-span-2">
              <label className="block text-[11px] font-bold text-slate-600 tracking-wide mb-1.5">Address *</label>
              <input 
                type="text" 
                value={formData.address} 
                onChange={(e) => updateField('address', e.target.value)} 
                disabled={isReadOnly} 
                required
                placeholder="Street address" 
                className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-blue-500 font-medium transition shadow-2xs" 
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 tracking-wide mb-1.5">City *</label>
              <input 
                type="text" 
                value={formData.city} 
                onChange={(e) => updateField('city', e.target.value)} 
                disabled={isReadOnly} 
                required
                placeholder="City" 
                className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-blue-500 font-medium transition shadow-2xs" 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 tracking-wide mb-1.5">State *</label>
              <CustomSelect 
                value={formData.state}
                placeholder="Select State"
                options={[
                  { value: 'CA', label: 'California' },
                  { value: 'NY', label: 'New York' },
                  { value: 'TX', label: 'Texas' }
                ]}
                onChange={(val) => updateField('state', val)}
                disabled={isReadOnly}
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 tracking-wide mb-1.5">Zip *</label>
              <input 
                type="text" 
                value={formData.zip} 
                onChange={(e) => updateField('zip', e.target.value)} 
                disabled={isReadOnly} 
                required
                placeholder="Zip Code" 
                className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-blue-500 font-medium transition shadow-2xs" 
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 tracking-wide mb-1.5">County *</label>
              <CustomSelect 
                value={formData.county}
                placeholder="Select County"
                options={[
                  { value: 'County A', label: 'County A' },
                  { value: 'County B', label: 'County B' }
                ]}
                onChange={(val) => updateField('county', val)}
                disabled={isReadOnly}
              />
            </div>
          </div>
        </div>

        {/* 🏢 Card 3: Concerns In The Home */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/70 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 pb-3 gap-3">
            <div className="flex items-center gap-2 text-blue-700 font-extrabold text-xs tracking-wider uppercase">
              <div className="p-1 bg-blue-50 rounded-md"><Home size={14} /></div>
              <span>Concerns In The Home Section</span>
            </div>
            <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 px-4 py-1.5 rounded-xl text-xs font-bold">
              <span className="text-slate-500">Are there Concerns in The Home?</span>
              <div className="flex items-center gap-3">
                <label className="inline-flex items-center gap-1.5 cursor-pointer"><input type="radio" disabled={isReadOnly} checked={formData.hasHomeConcerns === 'Yes'} onChange={() => updateField('hasHomeConcerns', 'Yes')} className="accent-blue-600" /> Yes</label>
                <label className="inline-flex items-center gap-1.5 cursor-pointer"><input type="radio" disabled={isReadOnly} checked={formData.hasHomeConcerns === 'No'} onChange={() => updateField('hasHomeConcerns', 'No')} className="accent-blue-600" /> No</label>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            {/* Group 1: Access to Weapons */}
            <div className="bg-slate-50/40 p-4 rounded-xl border border-slate-200/60 space-y-2">
              <h4 className="font-extrabold text-slate-400 text-[10px] uppercase tracking-wider mb-1.5">Access to Weapons</h4>
              {[
                'Weapon(s) in Home', 'Weapon(s) Accessible', 
                'Guns & Ammunition NOT Stored Separately or Properly', 'No Concerns'
              ].map(opt => (
                <label key={opt} className={`flex items-start gap-2.5 py-0.5 font-medium text-slate-700 ${isInputDisabled('weapons', opt) ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}>
                  <input type="checkbox" disabled={isInputDisabled('weapons', opt)} checked={formData.weapons.includes(opt)} onChange={() => handleToggleCheckbox('weapons', opt)} className="mt-0.5 rounded text-blue-600 accent-blue-600" />
                  <span>{opt}</span>
                </label>
              ))}
            </div>

            {/* Group 2: Child's Living Space */}
            <div className="bg-slate-50/40 p-4 rounded-xl border border-slate-200/60 space-y-2">
              <h4 className="font-extrabold text-slate-400 text-[10px] uppercase tracking-wider mb-1.5">Child’s Living Space</h4>
              {[
                'Inadequate Sleeping Arrangements', 'Child Does not have His/Her Own Space', 'No Concerns'
              ].map(opt => (
                <label key={opt} className={`flex items-start gap-2.5 py-0.5 font-medium text-slate-700 ${isInputDisabled('livingSpace', opt) ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}>
                  <input type="checkbox" disabled={isInputDisabled('livingSpace', opt)} checked={formData.livingSpace.includes(opt)} onChange={() => handleToggleCheckbox('livingSpace', opt)} className="mt-0.5 rounded text-blue-600 accent-blue-600" />
                  <span>{opt}</span>
                </label>
              ))}
            </div>

            {/* Group 3: Sanitation */}
            <div className="bg-slate-50/40 p-4 rounded-xl border border-slate-200/60 space-y-2">
              <h4 className="font-extrabold text-slate-400 text-[11px] uppercase tracking-wider mb-1.5">Sanitation</h4>
              {[
                'Trash or Bags of Trash piled up Inside or Outside The Home',
                'Clutter Inside The Home That Affects The Living Environment',
                'Animal Feces Within the home / Around Outside Home',
                'Insects and Rodents Within The Home', 'Food Isn’t Stored Away Properly', 'No Concerns'
              ].map(opt => (
                <label key={opt} className={`flex items-start gap-2.5 py-0.5 font-medium text-slate-700 ${isInputDisabled('sanitation', opt) ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}>
                  <input type="checkbox" disabled={isInputDisabled('sanitation', opt)} checked={formData.sanitation.includes(opt)} onChange={() => handleToggleCheckbox('sanitation', opt)} className="mt-0.5 rounded text-blue-600 accent-blue-600" />
                  <span className="leading-tight">{opt}</span>
                </label>
              ))}
            </div>

            {/* Group 4: Chemicals */}
            <div className="bg-slate-50/40 p-4 rounded-xl border border-slate-200/60 space-y-2">
              <h4 className="font-extrabold text-slate-400 text-[10px] uppercase tracking-wider mb-1.5">Access to Chemicals / Unsafe Objects</h4>
              {[
                'Poisons Not Stored Away Properly', 'Sharp objects Not Stored Away Properly',
                'Small Objects / Choking Hazards Within Reach', 'No Concerns'
              ].map(opt => (
                <label key={opt} className={`flex items-start gap-2.5 py-0.5 font-medium text-slate-700 ${isInputDisabled('chemicals', opt) ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}>
                  <input type="checkbox" disabled={isInputDisabled('chemicals', opt)} checked={formData.chemicals.includes(opt)} onChange={() => handleToggleCheckbox('chemicals', opt)} className="mt-0.5 rounded text-blue-600 accent-blue-600" />
                  <span>{opt}</span>
                </label>
              ))}
            </div>

            {/* Group 5: Substance Abuse */}
            <div className="bg-slate-50/40 p-4 rounded-xl border border-slate-200/60 space-y-2">
              <h4 className="font-extrabold text-slate-400 text-[10px] uppercase tracking-wider mb-1.5">Signs Of Substance Use / Abuse</h4>
              {[
                'Signs of Excessive Alcohol Use, and Use of Illicit Drugs, Accessible Drugs and Alcohol',
                'Medications Not Stored Away Properly (out of reach/in locked cabinet)',
                'Alcohol and Cigarettes Not Out of Reach', 'No Concerns'
              ].map(opt => (
                <label key={opt} className={`flex items-start gap-2.5 py-0.5 font-medium text-slate-700 ${isInputDisabled('substanceUse', opt) ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}>
                  <input type="checkbox" disabled={isInputDisabled('substanceUse', opt)} checked={formData.substanceUse.includes(opt)} onChange={() => handleToggleCheckbox('substanceUse', opt)} className="mt-0.5 rounded text-blue-600 accent-blue-600" />
                  <span className="leading-tight">{opt}</span>
                </label>
              ))}
            </div>

            {/* Group 6: Neighborhood Climate */}
            <div className="bg-slate-50/40 p-4 rounded-xl border border-slate-200/60 space-y-2">
              <h4 className="font-extrabold text-slate-400 text-[10px] uppercase tracking-wider mb-1.5">Climate of Neighborhood / Home</h4>
              {[
                'High / Concerning Level of Violence in Home or Neighborhood',
                'High / Concerning Traffic In and Out of The Home', 'No or Low Level of Support',
                'Inaccessibility of Transportation', 'Inaccessibility of Communication (telephone, other methods, etc.)', 'No Concerns'
              ].map(opt => (
                <label key={opt} className={`flex items-start gap-2.5 py-0.5 font-medium text-slate-700 ${isInputDisabled('climate', opt) ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}>
                  <input type="checkbox" disabled={isInputDisabled('climate', opt)} checked={formData.climate.includes(opt)} onChange={() => handleToggleCheckbox('climate', opt)} className="mt-0.5 rounded text-blue-600 accent-blue-600" />
                  <span className="leading-tight">{opt}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Explanation Textarea Box */}
          <div className="pt-2">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <FileText size={13} className="text-slate-400" /> Please Explain Any of the Above Marked
            </label>
            <textarea 
              value={formData.homeConcernsExplanation} 
              onChange={(e) => updateField('homeConcernsExplanation', e.target.value)} 
              disabled={isReadOnly} 
              rows={3} 
              placeholder="Provide situational analysis context..." 
              className="w-full px-4 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-blue-500 font-medium transition shadow-2xs resize-none" 
            />
          </div>

          {/* Other Risk Factors Nested Section */}
          <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-2xl space-y-3">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-slate-800">Other Risk Issues in Home?</span>
              <div className="flex gap-4">
                <label className="inline-flex items-center gap-1.5 cursor-pointer"><input type="radio" disabled={isReadOnly} checked={formData.otherRiskIssues === 'Yes'} onChange={() => updateField('otherRiskIssues', 'Yes')} className="accent-blue-600" /> Yes</label>
                <label className="inline-flex items-center gap-1.5 cursor-pointer"><input type="radio" disabled={isReadOnly} checked={formData.otherRiskIssues === 'No'} onChange={() => updateField('otherRiskIssues', 'No')} className="accent-blue-600" /> No</label>
              </div>
            </div>
            {formData.otherRiskIssues === 'Yes' && (
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">If YES, then Explain</label>
                <textarea 
                  value={formData.otherRiskExplanation} 
                  onChange={(e) => updateField('otherRiskExplanation', e.target.value)} 
                  disabled={isReadOnly} 
                  rows={2}
                  className="w-full px-4 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-blue-500 font-medium transition resize-none shadow-2xs" 
                />
              </div>
            )}
          </div>
        </div>

        {/* ⚡ Card 4: Physical Status of Home */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/70 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 pb-3 gap-3">
            <div className="flex items-center gap-2 text-blue-700 font-extrabold text-xs tracking-wider uppercase">
              <div className="p-1 bg-blue-50 rounded-md"><AlertTriangle size={14} /></div>
              <span>Physical Status of Home section</span>
            </div>
            <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 px-4 py-1.5 rounded-xl text-xs font-bold">
              <span className="text-slate-500">Concerns?</span>
              <div className="flex items-center gap-3">
                <label className="inline-flex items-center gap-1.5 cursor-pointer"><input type="radio" disabled={isReadOnly} checked={formData.hasPhysicalConcerns === 'Yes'} onChange={() => updateField('hasPhysicalConcerns', 'Yes')} className="accent-blue-600" /> Yes</label>
                <label className="inline-flex items-center gap-1.5 cursor-pointer"><input type="radio" disabled={isReadOnly} checked={formData.hasPhysicalConcerns === 'No'} onChange={() => updateField('hasPhysicalConcerns', 'No')} className="accent-blue-600" /> No</label>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 text-xs">
            {[
              'Exposed Electrical Wires / Faulty Wiring', 'Exposed Outlets', 'Broken Windows',
              'No Running Water / No Access to Water', 'Scalding Water', 'Standing Water (poses danger to drowning / insects / etc.)',
              'No Power', 'Inadequate Heating/Cooling System', 'Home Doesn’t Have Smoke/Carbon Monoxide Detectors',
              'Stairs Aren’t Secured', 'Lack of Barriers on The Stairs, porches, and Windows', 'Holes in The Floor/Walls',
              'Cords on Blinds and Curtains not Out of Reach (Age Appropriate)', 'Mold / Mildew in The Home', 'Septic Problems', 'Other'
            ].map(item => (
              <label key={item} className="flex items-start gap-2.5 p-2 bg-slate-50/40 border border-slate-100 rounded-xl hover:bg-slate-50 font-medium transition cursor-pointer text-slate-700">
                <input type="checkbox" disabled={isReadOnly} checked={formData.physicalItems.includes(item)} onChange={() => handleToggleCheckbox('physicalItems', item)} className="mt-0.5 rounded text-blue-600 accent-blue-600" />
                <span className="leading-tight">{item}</span>
              </label>
            ))}
          </div>
        </div>

        {/* 🛡️ Card 5: Caregiver Protective Capacities */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/70 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5 text-blue-700 font-extrabold text-xs tracking-wider uppercase">
            <div className="p-1 bg-blue-50 rounded-md"><ShieldCheck size={14} /></div>
            <span>Caregiver Protective Capacities section</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs">
            {[
              'Recognizes Threats', 'Can Articulate a Plan Sufficient to Protect The Child',
              'Demonstrates Protective Role and Responsibilities; Has a History of Taking Action to Protect',
              'Recognizes The Child\'s Needs and Holds Realistic Expectations', 'Expresses Empathy and Sensitivity For The Child',
              'Has The Cognitive Capacity and Has Adequate Knowledge to Protect The Child, Including Using Resources Necessary to Meet The Child\'s Basic Needs',
              'The Caretaker Accurately processes The External World Without Distortions', 'Has The Capacity to Learn From an Experience and Apply It to a New Situation',
              'Is Emotionally Able to Intervene And Protect', 'Is Resilient As a Caregiver', 'Is Adaptive As a Caregiver',
              'Sets Aside Her/His Needs in Favor of The Child', 'Demonstrates Tolerance', 'Demonstrates Sufficient Impulse and Emotional Control',
              'Is Physically Able to Protect', 'Caregiver and Child Have a Strong Emotional Bond and Positive Attachment',
              'Child Is Safe At Home', 'Need For Custody', 'Safety Plan Created'
            ].map(item => (
              <label key={item} className="flex items-start gap-2.5 p-3 bg-slate-50/30 border border-slate-200/50 rounded-xl hover:bg-slate-50 font-medium transition cursor-pointer text-slate-700">
                <input type="checkbox" disabled={isReadOnly} checked={formData.capacities.includes(item)} onChange={() => handleToggleCheckbox('capacities', item)} className="mt-0.5 rounded text-blue-600 accent-blue-600" />
                <span className="leading-relaxed">{item}</span>
              </label>
            ))}
          </div>

          {/* Abandonment Text Input Block */}
          <div className="pt-2">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              Abandonment Or Aggravated Circumstances
            </label>
            <textarea 
              value={formData.abandonmentText} 
              onChange={(e) => updateField('abandonmentText', e.target.value)} 
              disabled={isReadOnly} 
              rows={3} 
              placeholder="Describe abandonment dynamics or factors..." 
              className="w-full px-4 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-blue-500 font-medium transition shadow-2xs resize-none" 
            />
          </div>
        </div>

        {/* 🔒 Card 6: Read-Only Governance Panel */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/70 shadow-xs space-y-3">
          <div 
            onClick={() => {
              updateField('isCompleted', !formData.isCompleted);
            }}
            className={`flex items-start gap-4 bg-slate-50/50 hover:bg-slate-50 border border-slate-200/50 p-4 rounded-xl select-none transition-all group ${isReadOnly ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
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
                <Lock size={13} className="text-slate-400" /> Mark as completed. (And lock this Assessment as Read Only)
              </span>
              <span className="text-[10px] font-medium text-slate-400/90 mt-0.5">Freezes this record asset. Safe lock mechanism prevents further mutations.</span>
            </div>
          </div>
        </div>

        {/* 🏁 Bottom Action Buttons Panel */}
        <div className="flex justify-end items-center gap-3 pt-5 border-t border-slate-200/80">
          <button 
            type="button" 
            onClick={() => navigate('/assessments')} 
            className="px-5 py-2.5 border border-slate-200 text-slate-700 rounded-xl bg-white hover:bg-slate-50 text-xs font-bold shadow-2xs transition-all active:scale-95"
          >
            Cancel
          </button>
          
          <button 
            type="submit" 
            disabled={isReadOnly} // লক করা থাকলে বাটন ও ডিজেবল থাকবে
            className={`px-6 py-2.5 rounded-xl text-xs font-bold text-white shadow-md transition-all active:scale-95 ${
              isReadOnly 
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                : formData.isCompleted 
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-emerald-600/10' 
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-600/10'
            }`}
          >
            {/* 🌟 কন্ডিশনাল বাটন টেক্সট */}
            {isReadOnly 
              ? 'Locked & Saved' 
              : formData.isCompleted 
                ? 'Complete & Lock' 
                : isEditMode 
                  ? 'Update Assessment' 
                  : 'Save Draft'
            }
          </button>
        </div>
      </form>
    </div>
  );
};