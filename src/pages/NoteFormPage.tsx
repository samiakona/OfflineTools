import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Mic, User, Calendar, Bell, ShieldCheck, Check, ChevronDown, Layers, X, Clock, MapPin, Briefcase, ListPlus, Users, FileText } from 'lucide-react';
import { db, type CaseNote } from '../db';

// Custom Elegant Select Component for consistent layout border options
const CustomSelect: React.FC<{
  label?: string;
  value: string | number;
  options: { value: string | number; label: string }[];
  onChange: (value: any) => void;
  disabled?: boolean;
  placeholder?: string;
  icon?: React.ReactNode;
}> = ({ value, options, onChange, disabled, placeholder, icon }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className="relative w-full" ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl bg-white disabled:bg-slate-100/80 disabled:text-slate-400 text-left focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 font-medium transition shadow-2xs text-slate-700"
      >
        <span className="flex items-center gap-2 truncate">
          {icon}
          {selectedOption ? selectedOption.label : placeholder || 'Select Option'}
        </span>
        <ChevronDown size={15} className={`text-slate-400 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1.5 bg-white border border-slate-200/90 rounded-xl shadow-lg max-h-60 overflow-y-auto p-1 animate-in fade-in slide-in-from-top-1 duration-150">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg text-left transition ${
                opt.value === value 
                  ? 'bg-blue-50/70 text-blue-700' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <span className="truncate">{opt.label}</span>
              {opt.value === value && <Check size={14} strokeWidth={2.5} className="text-blue-600 shrink-0 ml-2" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export const NoteFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>(); 
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState<Omit<CaseNote, 'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>>({
    date: new Date().toISOString().split('T')[0],
    time: '12:00 AM',
    childName: 'seko jk',
    appointmentStatus: 'Attended',
    nextAppointmentDate: '',
    nextAppointmentTime: '',
    contactType: 'Staffing',
    location: 'School',
    serviceType: 'School Contact',
    additionalServices: ['Child and Family Team'],
    durationMinutes: 15,
    caseName: '',
    narrative: '',
    teamMember: 'Jahanara_Suchi, Supervisor (Supervisor)',
    otherAttendees: '',
    notifyTeam: false,
    isCompleted: false,
  });

  const [auditData, setAuditData] = useState<{ createdBy: string; createdAt: number; updatedBy: string; updatedAt: number } | null>(null);

  const timeOptions = (() => {
    const times = [];
    const periods = ['AM', 'PM'];
    for (let p = 0; p < 2; p++) {
      for (let h = 1; h <= 12; h++) {
        const hourStr = h < 10 ? `0${h}` : `${h}`;
        times.push({ value: `${hourStr}:00 ${periods[p]}`, label: `${hourStr}:00 ${periods[p]}` });
        times.push({ value: `${hourStr}:30 ${periods[p]}`, label: `${hourStr}:30 ${periods[p]}` });
      }
    }
    return times;
  })();

  const durationOptions = [
    { value: 15, label: '15 Mins' },
    { value: 30, label: '30 Mins' },
    { value: 45, label: '45 Mins' },
    { value: 60, label: '1 Hour' },
    { value: 90, label: '1.5 Hours' },
    { value: 120, label: '2 Hours' },
  ];

  const availableAdditionalServices = [
    'Child and Family Team', 'Mental Health Counseling', 'Substance Abuse Support',
    'Foster Parent Training', 'Legal Advocacy', 'Housing Assistance', 'Educational Tutoring'
  ];

  useEffect(() => {
    if (isEditMode && id) {
      db.caseNotes.get(Number(id)).then((note) => {
        if (note) {
          const { id, createdAt, createdBy, updatedAt, updatedBy, ...rest } = note;
          setFormData(rest);
          setAuditData({ createdBy, createdAt, updatedBy, updatedAt });
        }
      });
    }
  }, [id, isEditMode]);

  const updateField = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddService = (value: string) => {
    if (value && !formData.additionalServices.includes(value)) {
      setFormData(prev => ({ ...prev, additionalServices: [...prev.additionalServices, value] }));
    }
  };

  const handleRemoveService = (serviceToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      additionalServices: prev.additionalServices.filter(service => service !== serviceToRemove)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const now = Date.now();

    if (isEditMode && id) {
      await db.caseNotes.update(Number(id), { ...formData, updatedAt: now, updatedBy: 'Masum_Sup' });
    } else {
      await db.caseNotes.add({
        ...formData,
        createdAt: now,
        createdBy: 'Masum_Sup',
        updatedAt: now,
        updatedBy: 'Masum_Sup'
      } as CaseNote);
    }
    navigate('/'); 
  };

  const isReadOnly = formData.isCompleted;

  return (
    <div className="max-w-5xl mx-auto space-y-6 text-slate-800 pb-16 antialiased p-2">
      
      {/* 🔝 Top Header Navigation */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-200/80 pb-5 gap-4">
        <div className="flex items-center gap-4">
          <button 
            type="button"
            onClick={() => navigate('/')} 
            className="p-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 rounded-xl transition-all shadow-2xs active:scale-95"
          >
            <ArrowLeft size={16} strokeWidth={2.5} />
          </button>
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              {isEditMode ? `Edit Case Note` : 'Create New Case Note'}
            </h2>
            <p className="text-xs font-medium text-slate-500 mt-0.5">
              {isEditMode ? `Updating parameters for: ${formData.caseName || 'Selected Case'}` : 'Fill in the specific parameters for child documentation.'}
            </p>
          </div>
        </div>

        {isReadOnly && (
          <span className="flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200/60 px-3.5 py-2 rounded-full shadow-2xs animate-pulse">
            <ShieldCheck size={14} /> Locked Asset (Read-Only)
          </span>
        )}
      </div>

      {/* 📦 Form Container: হালকা ব্যাকগ্রাউন্ড এবং সেকশনগুলোর মাঝে গ্যাপ বাড়ানোর জন্য space-y-6 ব্যবহার করা হয়েছে */}
      <form onSubmit={handleSubmit} className="bg-slate-50/60 rounded-2xl p-2 sm:p-4 space-y-6">
        
        {/* 📅 Card 1: Timestamp & Duration */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/70 shadow-xs grid grid-cols-1 md:grid-cols-3 gap-5">
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
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white disabled:bg-slate-100/80 disabled:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 font-medium transition shadow-2xs text-slate-700"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Clock size={13} className="text-slate-400" /> Time *
            </label>
            <CustomSelect 
              value={formData.time} 
              options={timeOptions} 
              onChange={(val) => updateField('time', val)} 
              disabled={isReadOnly}
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Clock size={13} className="text-slate-400" /> Duration *
            </label>
            <CustomSelect 
              value={formData.durationMinutes} 
              options={durationOptions} 
              onChange={(val) => updateField('durationMinutes', Number(val))} 
              disabled={isReadOnly}
            />
          </div>
        </div>

        {/* 👤 Card 2: People Involvement */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/70 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5 text-blue-700 font-extrabold text-xs tracking-wider uppercase">
            <div className="p-1 bg-blue-50 rounded-md"><User size={14} /></div>
            <span>People Involvement</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 tracking-wide mb-1.5">Child Name *</label>
              <CustomSelect 
                value={formData.childName}
                options={[
                  { value: 'seko jk', label: 'seko jk' },
                  { value: 'Danielle Hernandez', label: 'Danielle Hernandez' },
                  { value: 'Alex Gomez', label: 'Alex Gomez' },
                  { value: 'Sarah Jenkins', label: 'Sarah Jenkins' }
                ]}
                onChange={(val) => updateField('childName', val)}
                disabled={isReadOnly}
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 tracking-wide mb-1.5">Case Name / Identifier *</label>
              <input 
                type="text" 
                value={formData.caseName} 
                onChange={(e) => updateField('caseName', e.target.value)} 
                disabled={isReadOnly} 
                required 
                placeholder="e.g. Intake_4350" 
                className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 font-medium transition shadow-2xs" 
              />
            </div>
          </div>
        </div>

        {/* 💼 Card 3: Appointment & Service Configurations */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/70 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5 text-blue-700 font-extrabold text-xs tracking-wider uppercase">
            <div className="p-1 bg-blue-50 rounded-md"><Briefcase size={14} /></div>
            <span>Appointment & Service Configuration</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 tracking-wide mb-1.5">Appointment Status *</label>
              <CustomSelect 
                value={formData.appointmentStatus}
                options={[
                  { value: 'Attended', label: 'Attended' },
                  { value: 'Missed', label: 'Missed' },
                  { value: 'Canceled', label: 'Canceled' },
                  { value: 'Rescheduled', label: 'Rescheduled' }
                ]}
                onChange={(val) => updateField('appointmentStatus', val)}
                disabled={isReadOnly}
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 tracking-wide mb-1.5 flex items-center gap-1"><Calendar size={12} className="text-slate-400" /> Next Appointment Date</label>
              <input type="date" value={formData.nextAppointmentDate} onChange={(e) => updateField('nextAppointmentDate', e.target.value)} disabled={isReadOnly} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 font-medium transition shadow-2xs text-slate-700" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 tracking-wide mb-1.5 flex items-center gap-1"><Clock size={12} className="text-slate-400" /> Next Appointment Time</label>
              <CustomSelect 
               value={formData.nextAppointmentTime || ''}
                options={[{ value: '', label: 'Select Time' }, ...timeOptions]}
                onChange={(val) => updateField('nextAppointmentTime', val)}
                disabled={isReadOnly}
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 tracking-wide mb-1.5 flex items-center gap-1"><Users size={12} className="text-slate-400" /> Contact Type *</label>
              <CustomSelect 
                value={formData.contactType}
                options={[
                  { value: 'Staffing', label: 'Staffing' },
                  { value: 'Client Visit', label: 'Client Visit' },
                  { value: 'Phone Call', label: 'Phone Call' },
                  { value: 'Email Response', label: 'Email Response' }
                ]}
                onChange={(val) => updateField('contactType', val)}
                disabled={isReadOnly}
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 tracking-wide mb-1.5 flex items-center gap-1"><MapPin size={12} className="text-slate-400" /> Location *</label>
              <CustomSelect 
                value={formData.location}
                options={[
                  { value: 'School', label: 'School' },
                  { value: 'Office', label: 'Office' },
                  { value: 'Home', label: 'Home' },
                  { value: 'Community Center', label: 'Community Center' }
                ]}
                onChange={(val) => updateField('location', val)}
                disabled={isReadOnly}
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 tracking-wide mb-1.5 flex items-center gap-1"><ListPlus size={12} className="text-slate-400" /> Service Type *</label>
              <CustomSelect 
                value={formData.serviceType}
                options={[
                  { value: 'School Contact', label: 'School Contact' },
                  { value: 'Court', label: 'Court' },
                  { value: 'Obtaining Community Resources', label: 'Obtaining Community Resources' },
                  { value: 'Supervised Visit', label: 'Supervised Visit' },
                  { value: 'Crisis Intervention', label: 'Crisis Intervention' }
                ]}
                onChange={(val) => updateField('serviceType', val)}
                disabled={isReadOnly}
              />
            </div>

            <div className="md:col-span-3 space-y-2.5 pt-2">
              <label className="block text-[11px] font-bold text-slate-600 tracking-wide">Additional Services</label>
              <CustomSelect 
                value=""
                placeholder="-- Choose Services to Add --"
                options={availableAdditionalServices.map(s => ({ value: s, label: s }))}
                onChange={(val) => handleAddService(val)}
                disabled={isReadOnly}
              />

              <div className="flex flex-wrap gap-2 pt-1.5">
                {formData.additionalServices.length === 0 ? (
                  <p className="text-slate-400/90 text-xs italic font-medium pl-1">No additional services selected.</p>
                ) : (
                  formData.additionalServices.map(service => (
                    <span key={service} className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-200/60 text-blue-700 px-3 py-1 rounded-xl text-xs font-bold shadow-2xs">
                      {service}
                      {!isReadOnly && (
                        <button type="button" onClick={() => handleRemoveService(service)} className="hover:bg-blue-200/80 p-0.5 rounded-full transition-colors text-blue-500 hover:text-blue-800">
                          <X size={12} strokeWidth={2.5} />
                        </button>
                      )}
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 📝 Card 4: Case Log Narrative */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/70 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5 text-blue-700 font-extrabold text-xs tracking-wider uppercase">
            <div className="p-1 bg-blue-50 rounded-md"><Layers size={14} /></div>
            <span>Case Log Narrative</span>
          </div>
          
          <div className="border border-slate-200 rounded-2xl overflow-hidden focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/5 transition bg-white shadow-2xs">
            <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200/80 flex justify-between items-center">
              <span className="font-bold text-[10px] text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <FileText size={13} /> Narrative Content
              </span>
              <button type="button" disabled={isReadOnly} className="flex items-center gap-1.5 border border-cyan-200 text-cyan-700 hover:text-cyan-800 bg-white hover:bg-cyan-50/50 px-3 py-1.5 rounded-xl font-bold text-xs shadow-2xs transition-all active:scale-95 disabled:opacity-50">
                <Mic size={13} className="animate-pulse text-cyan-600" /> Live Dictation
              </button>
            </div>
            
            <textarea 
              value={formData.narrative} 
              onChange={(e) => updateField('narrative', e.target.value)} 
              disabled={isReadOnly} 
              rows={8} 
              placeholder="Type or dictate full case narration..." 
              className="w-full p-4 focus:outline-none resize-none text-sm bg-white text-slate-800 placeholder-slate-400 font-medium" 
              required
            />
          </div>
        </div>

        {/* 👥 Card 5: Assignment & Extra Attendees */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/70 shadow-xs grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 tracking-wide mb-1.5">Primary Team Member</label>
            <CustomSelect 
              value={formData.teamMember}
              options={[
                { value: 'Jahanara_Suchi, Supervisor (Supervisor)', label: 'Jahanara_Suchi, Supervisor (Supervisor)' },
                { value: 'Rahat_Keramat, Case Worker', label: 'Rahat_Keramat, Case Worker' },
                { value: 'Tasnim_Alam, Field Officer', label: 'Tasnim_Alam, Field Officer' }
              ]}
              onChange={(val) => updateField('teamMember', val)}
              disabled={isReadOnly}
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-600 tracking-wide mb-1.5">Other Attendees</label>
            <textarea value={formData.otherAttendees} onChange={(e) => updateField('otherAttendees', e.target.value)} disabled={isReadOnly} rows={2} className="w-full px-4 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 font-medium transition resize-none shadow-2xs" placeholder="Enter comma separated attendee names..." />
          </div>
        </div>

        {/* 🔔 Card 6: Functional Checkbox Panel */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/70 shadow-xs space-y-3.5">
          {/* Checkbox item 1: Notify Team */}
          <div 
            onClick={() => !isReadOnly && updateField('notifyTeam', !formData.notifyTeam)}
            className="flex items-start gap-4 bg-slate-50/50 hover:bg-slate-50 border border-slate-200/50 p-4 rounded-xl cursor-pointer select-none transition-all group"
          >
            <div className="relative flex items-center justify-center w-5 h-5 mt-0.5 shrink-0">
              <input 
                type="checkbox" 
                checked={formData.notifyTeam} 
                readOnly
                disabled={isReadOnly}
                className="sr-only" 
              />
              <div className={`w-5 h-5 bg-white border rounded-md flex items-center justify-center transition-all shadow-3xs group-hover:border-slate-400 ${formData.notifyTeam ? 'border-blue-600' : 'border-slate-300'}`}>
                {formData.notifyTeam && (
                  <Check size={14} strokeWidth={3} className="text-blue-600 animate-in zoom-in-75 duration-100" />
                )}
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Bell size={13} className="text-slate-400" /> Notify All Team Members
              </span>
              <span className="text-[10px] font-medium text-slate-400/90 mt-0.5">Broadcast an automated system alert to connected caseworkers regarding this update.</span>
            </div>
          </div>

          {/* Checkbox item 2: Mark Completed */}
          <div 
            onClick={() => updateField('isCompleted', !formData.isCompleted)}
            className="flex items-start gap-4 bg-slate-50/50 hover:bg-slate-50 border border-slate-200/50 p-4 rounded-xl cursor-pointer select-none transition-all group"
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
                <ShieldCheck size={13} className="text-slate-400" /> Mark Record as Finalized & Completed
              </span>
              <span className="text-[10px] font-medium text-slate-400/90 mt-0.5">Freeze this record asset. Safe lock mechanism prevents further mutations.</span>
            </div>
          </div>
        </div>

        {/* 📝 Card 7: Audit Logs */}
        {isEditMode && auditData && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[11px] bg-white p-5 rounded-2xl border border-slate-200/70 text-slate-500 font-medium shadow-xs">
            <div className="space-y-1">
              <p className="font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> System Birth Log
              </p>
              <p>Author ID: <span className="text-slate-800 font-semibold">{auditData.createdBy}</span></p>
              <p>Timestamp: <span className="text-slate-800 font-semibold">{new Date(auditData.createdAt).toLocaleString()}</span></p>
            </div>
            <div className="space-y-1 border-t sm:border-t-0 sm:border-l border-slate-200 pt-3 sm:pt-0 sm:pl-4">
              <p className="font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> System Mutation Log
              </p>
              <p>Operator ID: <span className="text-slate-800 font-semibold">{auditData.updatedBy}</span></p>
              <p>Last Activity: <span className="text-slate-800 font-semibold">{new Date(auditData.updatedAt).toLocaleString()}</span></p>
            </div>
          </div>
        )}

        {/* 🏁 Bottom Action Buttons Panel */}
        <div className="flex justify-end items-center gap-3 pt-5 border-t border-slate-200/80">
          <button 
            type="button" 
            onClick={() => navigate('/')} 
            className="px-5 py-2.5 border border-slate-200 text-slate-700 rounded-xl bg-white hover:bg-slate-50 text-xs font-bold shadow-2xs transition-all active:scale-95"
          >
            Cancel
          </button>
          {!isReadOnly && (
            <button 
              type="submit" 
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/10 transition-all active:scale-95"
            >
              {isEditMode ? 'Update Document' : 'Publish Document'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};