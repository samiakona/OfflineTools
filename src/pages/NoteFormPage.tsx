import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, User, Calendar, Bell, ShieldCheck, 
  Check, Layers, Clock, MapPin, Briefcase, 
  ListPlus, Users, Phone, UserCheck,
  Wifi, WifiOff, ChevronDown
} from 'lucide-react';
import type { CaseNoteFormData } from '../types/caseNote';
import { CustomSelect } from '../components/Common/CustomSelect';
import { MultiSelectInput } from '../components/Common/MultiSelectInput';
import { caseNoteService } from '../services/caseNoteService';
import { useCaseList } from '../hooks/useCaseList';
import { useTeamMembers } from '../hooks/useTeamMembers';
import toast from 'react-hot-toast';

// Enums and Lookup Data
const CLIENT_TYPES = [
  { value: '0', label: 'Child' },
  { value: '1', label: 'Parent' },
  { value: '2', label: 'Other' },
  { value: '3', label: 'Group' }
];

const APPOINTMENT_STATUSES = [
  { value: '1', label: 'Attended' },
  { value: '2', label: 'Cancel By client' },
  { value: '3', label: 'Cancel By provider' },
  { value: '4', label: 'Cancel By FSP' },
  { value: '5', label: 'No Show' },
  { value: '6', label: 'Unable to See/Other' },
  { value: '7', label: 'N/A' }
];

const CONTACT_TYPES = [
  { value: '1', label: 'Phone' },
  { value: '2', label: 'Face to Face' },
  { value: '3', label: 'Email' },
  { value: '4', label: 'Text' },
  { value: '5', label: 'N/A' },
  { value: '6', label: 'Letter' },
  { value: '7', label: 'Virtual' },
  { value: '8', label: 'Note to File' },
  { value: '9', label: 'Staffing' }
];

const LOCATIONS = [
  { value: '1', label: 'Home' },
  { value: '2', label: 'Office' },
  { value: '3', label: 'Relatives Home' },
  { value: '4', label: 'School' },
  { value: '5', label: 'Community Home' },
  { value: '6', label: 'Foster Care' },
  { value: '7', label: 'Therapeutic Foster Care' },
  { value: '8', label: 'Work' },
  { value: '9', label: 'Not Applicable' },
  { value: '10', label: 'Jail/Prison' },
  { value: '11', label: 'Hospital' },
  { value: '12', label: 'Court' },
  { value: '13', label: 'Placement Location' },
  { value: '14', label: 'WIC' },
  { value: '15', label: 'Child Support' },
  { value: '16', label: 'Enrollment' },
  { value: '17', label: 'Food Stamps' },
  { value: '18', label: 'Community Visit' },
  { value: '19', label: 'Other' }
];

const SERVICE_TYPES = [
  { value: '1', label: 'Child and Family Team' },
  { value: '2', label: 'Residential Placement' },
  { value: '3', label: 'Treatment Contract' },
  { value: '4', label: 'N/A' },
  { value: '5', label: 'Placement Contact' },
  { value: '6', label: 'Parent Contact' },
  { value: '7', label: 'Child Contact' },
  { value: '8', label: 'Support Meeting' },
  { value: '9', label: 'Court' },
  { value: '10', label: 'Transportation' },
  { value: '11', label: 'Supervised Visit' },
  { value: '12', label: 'Medical' },
  { value: '13', label: 'BH Contact (For Therapy)' },
  { value: '14', label: 'School Contact' },
  { value: '15', label: 'PIP' },
  { value: '16', label: 'Obtaining Community Resources' },
  { value: '17', label: 'General Case Management' },
  { value: '18', label: 'Staffing with Supervisor' },
  { value: '19', label: 'Staffing with Group' },
  { value: '20', label: 'Legal' },
  { value: '21', label: 'Closing Summary' },
  { value: '22', label: 'PAP' },
  { value: '23', label: 'Wizards and Fairies' },
  { value: '24', label: 'Update Case Plan' }
];

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

export const NoteFormPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>(); 
  const isEditMode = Boolean(id);
  
  // Get loginId from location state or default to '1'
  const loginId = (location.state as any)?.loginId || '1';

  // 🟢 Online/Offline State
  const [isOnline, setIsOnline] = useState<boolean | undefined>(undefined);
  const [isFirstCheckDone, setIsFirstCheckDone] = useState<boolean>(false);

  // 🟢 Case List Hook
  const { 
    cases, 
    isLoading: casesLoading, 
    fetchCases, 
    fetchCaseDetails,
    getCaseById,
    getAllParents,
    getAllChildren,
    getParentsByCase,
    getChildrenByCase
  } = useCaseList(loginId);
  useEffect(() => {}, [getCaseById]); // For debugging case data changes
  
  // 🟢 Team Members Hook
  const { members: teamMembers, isLoading: teamMembersLoading } = useTeamMembers(isOnline || false);

  const [formData, setFormData] = useState<CaseNoteFormData>({
    date: new Date().toISOString().split('T')[0],
    time: '09:30 AM',
    childName: '',
    appointmentStatus: '1', 
    nextAppointmentDate: '',
    nextAppointmentTime: '',
    contactType: '2', 
    location: '4', 
    serviceType: '7', 
    additionalServices: [],
    durationMinutes: 60,
    caseName: '',
    narrative: '',
    teamMember: '', 
    otherAttendees: '',
    notifyTeam: false, 
    isCompleted: false,
    clientType: '2', 
    clientId: '',
    clientName: '',
    selectedCase: '',
    parentNames: [],
    childNames: [],
  });

  const [auditData, setAuditData] = useState<{ createdBy: string; createdAt: number; updatedBy: string; updatedAt: number } | null>(null);

  // 🟢 Network check function
  const checkNetworkStatus = async (): Promise<boolean> => {
    try {
      const endpoints = [
        'https://cdn.jsdelivr.net/npm/package.json',
        'https://unpkg.com/package.json'
      ];

      for (const endpoint of endpoints) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 1500);
          
          const response = await fetch(endpoint, {
            method: 'HEAD',
            cache: 'no-cache',
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          if (response.ok || response.status === 200) {
            setIsOnline(true);
            setIsFirstCheckDone(true);
            return true;
          }
        } catch (err) {
          continue;
        }
      }

      setIsOnline(false);
      setIsFirstCheckDone(true);
      return false;

    } catch (error) {
      console.error('Network check error:', error);
      setIsOnline(false);
      setIsFirstCheckDone(true);
      return false;
    }
  };

  // 🟢 Network monitoring
  useEffect(() => {
    const performInitialCheck = async () => {
      const initialStatus = navigator.onLine;
      setIsOnline(initialStatus);
      await checkNetworkStatus();
    };

    performInitialCheck();

    const intervalId = setInterval(() => {
      checkNetworkStatus();
    }, 3000);

    const handleOnline = () => {
      setIsOnline(true);
      setIsFirstCheckDone(true);
      toast.success('🔄 Connection restored!', {
        duration: 2000,
        style: {
          background: '#22c55e',
          color: '#fff',
          borderRadius: '12px',
          fontSize: '13px',
          fontWeight: 'bold',
        }
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      setIsFirstCheckDone(true);
      toast.error('📡 You are offline. Please check your connection.', {
        duration: 3000,
        style: {
          background: '#ef4444',
          color: '#fff',
          borderRadius: '12px',
          fontSize: '13px',
          fontWeight: 'bold',
        }
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 🟢 Fetch cases when online
  useEffect(() => {
    if (isOnline) {
      fetchCases();
    }
  }, [isOnline]);

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

  const updateField = <K extends keyof CaseNoteFormData>(name: K, value: CaseNoteFormData[K]) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // ✅ Case select handler
  const handleCaseSelect = async (caseName: string) => {
    updateField('caseName', caseName);
    updateField('selectedCase', caseName);
    
    // Default selected case from state
    let selectedCase = getCaseById(caseName);

    // If online, always try to fetch fresh details to get parents and children
    if (isOnline) {
      const details = await fetchCaseDetails(caseName);
      if (details) {
        selectedCase = details;
      }
    }

    if (selectedCase) {
      updateField('caseId', selectedCase.id);
      
      // Set client type based on selected case
      if (selectedCase.isGroup) {
        updateField('clientType', '3'); // Group
        updateField('parentNames', selectedCase.parents?.map(p => p.name) || []);
        updateField('childNames', selectedCase.children?.map(c => c.name) || []);
        updateField('clientName', '');
        updateField('clientId', '');
      } else {
        // Parent or Child case
        if (selectedCase.parents && selectedCase.parents.length > 0) {
          updateField('clientType', '1'); // Parent
          updateField('parentNames', selectedCase.parents.map(p => p.name));
          updateField('childNames', []);
          updateField('clientName', selectedCase.parents.map(p => p.name).join(', '));
          updateField('clientId', String(selectedCase.parents[0].id) || '');
        } else if (selectedCase.children && selectedCase.children.length > 0) {
          updateField('clientType', '0'); // Child
          updateField('childNames', selectedCase.children.map(c => c.name));
          updateField('parentNames', []);
          updateField('clientName', selectedCase.children.map(c => c.name).join(', '));
          updateField('clientId', String(selectedCase.children[0].id) || '');
        }
      }
    }
  };

  const handleClientTypeChange = (value: string) => {
    updateField('clientType', value);
    updateField('clientId', '');
    updateField('clientName', '');
    // Reset fields based on type
    if (value !== '0') updateField('childNames', []);
    if (value !== '1') updateField('parentNames', []);
  };

  // Load note data for edit mode
  useEffect(() => {
    if (isEditMode && id) {
      caseNoteService.getNoteById(Number(id)).then((note) => {
        if (note) {
          const { id: _, createdAt, createdBy, updatedAt, updatedBy, ...rest } = note;
          
          let formattedDate = rest.date;
          if (rest.date && rest.date.includes('T')) {
            formattedDate = rest.date.split('T')[0];
          }

          const safeIsCompleted =
            rest.isCompleted === true ||
            String(rest.isCompleted).toLowerCase() === 'true';

          setFormData({
            ...rest,
            date: formattedDate || new Date().toISOString().split('T')[0],
            clientType: rest.clientType || '2',
            clientId: rest.clientId || '',
            clientName: rest.clientName || '',
            contactType: rest.contactType || '2',
            location: rest.location || '4',
            serviceType: rest.serviceType || '7',
            appointmentStatus: rest.appointmentStatus || '1',
            notifyTeam: rest.notifyTeam !== undefined ? String(rest.notifyTeam) === 'true' : false, 
            durationMinutes: rest.durationMinutes || 60,
            isCompleted: safeIsCompleted, 
            teamMember: rest.teamMember || '',
            selectedCase: rest.caseName || '',
            parentNames: rest.parentNames || [],
            childNames: rest.childNames || [],
          });

          // If online, try to load case data
          if (isOnline && rest.caseName) {
            const caseData = getCaseById(rest.caseName);
            if (caseData) {
              if (caseData.isGroup) {
                updateField('parentNames', caseData.parents?.map(p => p.name) || []);
                updateField('childNames', caseData.children?.map(c => c.name) || []);
              } else {
                if (caseData.parents && caseData.parents.length > 0) {
                  updateField('parentNames', caseData.parents.map(p => p.name));
                }
                if (caseData.children && caseData.children.length > 0) {
                  updateField('childNames', caseData.children.map(c => c.name));
                }
              }
            }
          }

          setAuditData({ createdBy, createdAt, updatedBy, updatedAt });
        }
      });
    }
  }, [id, isEditMode, isOnline]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentOperator = formData.teamMember || 'System_Operator';

    // Prepare client name from parentNames or childNames
    let clientName = formData.clientName;
    if (formData.clientType === '0' && formData.childNames && formData.childNames.length > 0) {
      clientName = formData.childNames.join(', ');
    } else if (formData.clientType === '1' && formData.parentNames && formData.parentNames.length > 0) {
      clientName = formData.parentNames.join(', ');
    } else if (formData.clientType === '3') {
      const allNames = [
        ...(formData.parentNames || []),
        ...(formData.childNames || [])
      ];
      clientName = allNames.join(', ') || 'Group';
    }

    const noteToSave = {
      date: formData.date,
      time: formData.time,
      childName: clientName || formData.childName,
      appointmentStatus: formData.appointmentStatus,
      nextAppointmentDate: formData.nextAppointmentDate,
      nextAppointmentTime: formData.nextAppointmentTime,
      contactType: formData.contactType,
      location: formData.location,
      serviceType: formData.serviceType,
      additionalServices: formData.additionalServices,
      durationMinutes: formData.durationMinutes,
      caseName: formData.caseName,
      caseId: formData.caseId || (getCaseById(formData.caseName) ? getCaseById(formData.caseName)?.id : ''),
      narrative: formData.narrative,
      teamMember: formData.teamMember,
      otherAttendees: formData.otherAttendees,
      notifyTeam: formData.notifyTeam,
      isCompleted: formData.isCompleted,
      clientType: formData.clientType,
      clientId: formData.clientId,
      clientName: clientName,
      parentNames: formData.parentNames,
      childNames: formData.childNames,
    };

    console.log('💾 Saving note with Case Name:', noteToSave.caseName);
    console.log('💾 Client Name:', noteToSave.clientName);

    try {
      if (isEditMode && id) {
        await caseNoteService.updateNote(Number(id), noteToSave, currentOperator);
        
        toast.success('Case note updated successfully!', {
          duration: 3000,
          style: {
            fontFamily: 'sans-serif',
            fontSize: '14px',
            fontWeight: 'bold',
            borderRadius: '12px',
            background: '#334155',
            color: '#fff',
          },
        });
        
        navigate('/');
      } else {
        await caseNoteService.createNote(noteToSave, currentOperator);
        
        setFormData(prev => ({
          ...prev,
          isCompleted: false
        }));

        toast.success('Case note created successfully!', {
          duration: 3000,
          style: {
            fontFamily: 'sans-serif',
            fontSize: '14px',
            fontWeight: 'bold',
            borderRadius: '12px',
            background: '#0ea5e9',
            color: '#fff',
          },
        });
        
        setTimeout(() => {
          localStorage.setItem('note_submitted', 'true');
          navigate('/', { replace: true });
        }, 150);
      }
    } catch (error) {
      console.error("❌ Failed to save case note:", error);
      
      toast.error('An error occurred while saving the document.', {
        style: {
          borderRadius: '12px',
          background: '#ef4444',
          color: '#fff',
        }
      });
    }
  };

  const isReadOnly = 
    formData.isCompleted === true || 
    String(formData.isCompleted).toLowerCase() === 'true';

  const showStatus = isFirstCheckDone;

  // ✅ Render client fields based on type and online status
  const renderClientFields = () => {
    const clientType = formData.clientType;
    const isGroup = clientType === '3';

    // ✅ ONLINE: Show dropdown with options
    if (isOnline) {
      if (isGroup) {
        // Get all parents and children from all cases - ensure arrays
        let parentPersons = getAllParents() || [];
        let childPersons = getAllChildren() || [];
        
        // If a case is selected, filter options for that case
        if (formData.selectedCase) {
          const caseParents = getParentsByCase(formData.selectedCase) || [];
          const caseChildren = getChildrenByCase(formData.selectedCase) || [];
          if (caseParents.length > 0) parentPersons = caseParents;
          if (caseChildren.length > 0) childPersons = caseChildren;
        }

        const parentOptions = parentPersons.map(p => p.name);
        const childOptions = childPersons.map(c => c.name);

        return (
          <div className="space-y-4">
            <MultiSelectInput
              label="Parent Names"
              values={formData.parentNames || []}
              options={parentOptions}
              onChange={(values) => {
                updateField('parentNames', values);
              }}
              disabled={isReadOnly}
              placeholder="Select parent names..."
              isLoading={casesLoading}
            />
            <MultiSelectInput
              label="Child Names"
              values={formData.childNames || []}
              options={childOptions}
              onChange={(values) => {
                updateField('childNames', values);
              }}
              disabled={isReadOnly}
              placeholder="Select child names..."
              isLoading={casesLoading}
            />
          </div>
        );
      }

      if (clientType === '0') {
        // Child type - show child dropdown
        let childPersons = getAllChildren() || [];
        
        if (formData.selectedCase) {
          const caseChildren = getChildrenByCase(formData.selectedCase) || [];
          if (caseChildren.length > 0) childPersons = caseChildren;
        }

        const childOptions = childPersons.map(c => c.name);

        return (
          <MultiSelectInput
            label="Child Names"
            values={formData.childNames || []}
            options={childOptions}
            onChange={(values) => {
              updateField('childNames', values);
              if (values.length > 0) {
                updateField('clientName', values.join(', '));
                const selectedPerson = childPersons.find(c => c.name === values[0]);
                updateField('clientId', selectedPerson ? String(selectedPerson.id) : '');
              } else {
                updateField('clientName', '');
                updateField('clientId', '');
              }
            }}
            disabled={isReadOnly}
            placeholder="Select child names..."
            isLoading={casesLoading}
          />
        );
      }

      if (clientType === '1') {
        // Parent type - show parent dropdown
        let parentPersons = getAllParents() || [];
        
        if (formData.selectedCase) {
          const caseParents = getParentsByCase(formData.selectedCase) || [];
          if (caseParents.length > 0) parentPersons = caseParents;
        }

        const parentOptions = parentPersons.map(p => p.name);

        return (
          <MultiSelectInput
            label="Parent Names"
            values={formData.parentNames || []}
            options={parentOptions}
            onChange={(values) => {
              updateField('parentNames', values);
              if (values.length > 0) {
                updateField('clientName', values.join(', '));
                const selectedPerson = parentPersons.find(p => p.name === values[0]);
                updateField('clientId', selectedPerson ? String(selectedPerson.id) : '');
              } else {
                updateField('clientName', '');
                updateField('clientId', '');
              }
            }}
            disabled={isReadOnly}
            placeholder="Select parent names..."
            isLoading={casesLoading}
          />
        );
      }

      // Other (type 2) - regular input
      return (
        <div>
          <label className="block text-[11px] font-bold text-slate-600 tracking-wide mb-1.5">
            <User size={12} /> Client Name *
          </label>
          <input 
            type="text"
            value={formData.clientName || ''}
            onChange={(e) => {
              updateField('clientName', e.target.value);
              updateField('clientId', e.target.value);
            }}
            disabled={isReadOnly}
            placeholder="Enter client name"
            required
            className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white disabled:bg-slate-100/80 focus:outline-none focus:border-blue-500 transition shadow-2xs font-medium"
          />
        </div>
      );
    }

    // ✅ OFFLINE: Show regular input fields
    if (isGroup) {
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 tracking-wide mb-1.5">
              Parent Names
            </label>
            <input 
              type="text"
              value={formData.parentNames?.join(', ') || ''}
              onChange={(e) => {
                const names = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                updateField('parentNames', names);
              }}
              disabled={isReadOnly}
              placeholder="Enter parent names (comma separated)"
              className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white disabled:bg-slate-100/80 focus:outline-none focus:border-blue-500 transition shadow-2xs font-medium"
            />
            <p className="text-[10px] text-slate-400 mt-1">Separate multiple names with commas</p>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-600 tracking-wide mb-1.5">
              Child Names
            </label>
            <input 
              type="text"
              value={formData.childNames?.join(', ') || ''}
              onChange={(e) => {
                const names = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                updateField('childNames', names);
              }}
              disabled={isReadOnly}
              placeholder="Enter child names (comma separated)"
              className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white disabled:bg-slate-100/80 focus:outline-none focus:border-blue-500 transition shadow-2xs font-medium"
            />
            <p className="text-[10px] text-slate-400 mt-1">Separate multiple names with commas</p>
          </div>
        </div>
      );
    }

    if (clientType === '0') {
      return (
        <div>
          <label className="block text-[11px] font-bold text-slate-600 tracking-wide mb-1.5">
            Child Names
          </label>
          <input 
            type="text"
            value={formData.childNames?.join(', ') || ''}
            onChange={(e) => {
              const names = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
              updateField('childNames', names);
              if (names.length > 0) {
                updateField('clientName', names.join(', '));
                updateField('clientId', names[0]);
              } else {
                updateField('clientName', '');
                updateField('clientId', '');
              }
            }}
            disabled={isReadOnly}
            placeholder="Enter child names (comma separated)"
            className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white disabled:bg-slate-100/80 focus:outline-none focus:border-blue-500 transition shadow-2xs font-medium"
          />
          <p className="text-[10px] text-slate-400 mt-1">Separate multiple names with commas</p>
        </div>
      );
    }

    if (clientType === '1') {
      return (
        <div>
          <label className="block text-[11px] font-bold text-slate-600 tracking-wide mb-1.5">
            Parent Names
          </label>
          <input 
            type="text"
            value={formData.parentNames?.join(', ') || ''}
            onChange={(e) => {
              const names = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
              updateField('parentNames', names);
              if (names.length > 0) {
                updateField('clientName', names.join(', '));
                updateField('clientId', names[0]);
              } else {
                updateField('clientName', '');
                updateField('clientId', '');
              }
            }}
            disabled={isReadOnly}
            placeholder="Enter parent names (comma separated)"
            className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white disabled:bg-slate-100/80 focus:outline-none focus:border-blue-500 transition shadow-2xs font-medium"
          />
          <p className="text-[10px] text-slate-400 mt-1">Separate multiple names with commas</p>
        </div>
      );
    }

    // Other (type 2)
    return (
      <div>
        <label className="block text-[11px] font-bold text-slate-600 tracking-wide mb-1.5">
          <User size={12} /> Client Name *
        </label>
        <input 
          type="text"
          value={formData.clientName || ''}
          onChange={(e) => {
            updateField('clientName', e.target.value);
            updateField('clientId', e.target.value);
          }}
          disabled={isReadOnly}
          placeholder="Enter client name"
          required
          className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white disabled:bg-slate-100/80 focus:outline-none focus:border-blue-500 transition shadow-2xs font-medium"
        />
      </div>
    );
  };

  // Case options for dropdown
  const caseOptions = cases.map(c => ({
    value: c.caseName,
    label: c.caseName
  }));

  // Team member options for dropdown
  const teamMemberOptions = teamMembers.map(m => ({
    value: m,
    label: m
  }));

  return (
    <div className="max-w-5xl mx-auto space-y-6 text-slate-800 pb-16 antialiased p-2">
      
      {/* Top Header Navigation */}
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

        {/* 🟢 Online/Offline Status Badge */}
        {showStatus && (
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-3.5 py-2 rounded-full border text-xs font-bold shadow-sm transition-all duration-300 ${
              isOnline 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                : 'bg-red-50 border-red-200 text-red-700'
            }`}>
              {isOnline ? (
                <>
                  <Wifi size={14} className="text-emerald-500" />
                  <span>Online</span>
                </>
              ) : (
                <>
                  <WifiOff size={14} className="text-red-500" />
                  <span>Offline</span>
                </>
              )}
            </div>

            {isReadOnly && (
              <span className="flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200/60 px-3.5 py-2 rounded-full shadow-2xs animate-pulse">
                <ShieldCheck size={14} /> Locked Asset (Read-Only)
              </span>
            )}
          </div>
        )}

        {/* 🟢 Check not done yet */}
        {!showStatus && isReadOnly && (
          <span className="flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200/60 px-3.5 py-2 rounded-full shadow-2xs animate-pulse">
            <ShieldCheck size={14} /> Locked Asset (Read-Only)
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="bg-slate-50/60 rounded-2xl p-2 sm:p-4 space-y-6">
        
        {/* ✅ NEW: Case Selection Section */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/70 shadow-xs">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5 mb-4 text-blue-700 font-extrabold text-xs tracking-wider uppercase">
            <div className="p-1 bg-blue-50 rounded-md"><Briefcase size={14} /></div>
            <span>Select Case</span>
            {casesLoading && <span className="text-slate-400 font-normal text-[10px] ml-2">Loading...</span>}
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 tracking-wide mb-1.5">
              Case Name / Identifier *
            </label>
            {isOnline ? (
              <div className="relative">
                <select
                  value={formData.selectedCase || formData.caseName || ''}
                  onChange={(e) => handleCaseSelect(e.target.value)}
                  disabled={isReadOnly || casesLoading}
                  className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 font-medium transition shadow-2xs appearance-none pr-10"
                >
                  <option value="">Select a case...</option>
                  {caseOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            ) : (
              <input 
                type="text" 
                value={formData.caseName} 
                onChange={(e) => updateField('caseName', e.target.value)} 
                disabled={isReadOnly} 
                required 
                placeholder="e.g., 2026-04-R0009, Intake_4350, CASE-2024-001"
                className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 font-medium transition shadow-2xs" 
              />
            )}
            <p className="text-[10px] text-slate-400 mt-1">
              {isOnline ? 'Select a case from the list' : 'Offline: Enter case name manually'}
            </p>
          </div>
        </div>

        {/* Card 1: Timestamp & Duration */}
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

        {/* Card 2: Client Information */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/70 shadow-xs">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5 mb-4 text-blue-700 font-extrabold text-xs tracking-wider uppercase">
            <div className="p-1 bg-blue-50 rounded-md"><UserCheck size={14} /></div>
            <span>Client Information</span>
          </div>

          <div className="grid grid-cols-1 gap-5">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 tracking-wide mb-1.5">
                <Users size={12} /> Client Type *
              </label>
              <CustomSelect 
                value={formData.clientType || '2'}
                options={CLIENT_TYPES}
                onChange={handleClientTypeChange}
                disabled={isReadOnly}
                placeholder="Select client type"
              />
            </div>
            
            <div>
              {renderClientFields()}
            </div>
          </div>
        </div>

        {/* Card 3: Appointment / Service Details */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/70 shadow-xs">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5 mb-4 text-blue-700 font-extrabold text-xs tracking-wider uppercase">
            <div className="p-1 bg-blue-50 rounded-md"><Briefcase size={14} /></div>
            <span>Appointment / Service Details</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 tracking-wide mb-1.5">Appointment Status *</label>
              <CustomSelect 
                value={formData.appointmentStatus}
                options={APPOINTMENT_STATUSES}
                onChange={(val) => updateField('appointmentStatus', val)}
                disabled={isReadOnly}
                placeholder="Select status"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 tracking-wide mb-1.5 flex items-center gap-1">
                <Calendar size={12} /> Next Appointment Date
              </label>
              <input 
                type="date" 
                value={formData.nextAppointmentDate || ''} 
                onChange={(e) => updateField('nextAppointmentDate', e.target.value)} 
                disabled={isReadOnly} 
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 font-medium transition shadow-2xs text-slate-700" 
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 tracking-wide mb-1.5 flex items-center gap-1">
                <Clock size={12} /> Next Appointment Time
              </label>
              <CustomSelect 
                value={formData.nextAppointmentTime || ''}
                options={[{ value: '', label: 'Select Time' }, ...TIME_OPTIONS]}
                onChange={(val) => updateField('nextAppointmentTime', val)}
                disabled={isReadOnly}
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 tracking-wide mb-1.5 flex items-center gap-1">
                <Phone size={12} /> Contact Type *
              </label>
              <CustomSelect 
                value={formData.contactType}
                options={CONTACT_TYPES}
                onChange={(val) => updateField('contactType', val)}
                disabled={isReadOnly}
                placeholder="Select contact type"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 tracking-wide mb-1.5 flex items-center gap-1">
                <MapPin size={12} /> Location *
              </label>
              <CustomSelect 
                value={formData.location}
                options={LOCATIONS}
                onChange={(val) => updateField('location', val)}
                disabled={isReadOnly}
                placeholder="Select location"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 tracking-wide mb-1.5 flex items-center gap-1">
                <ListPlus size={12} /> Service Type *
              </label>
              <CustomSelect 
                value={formData.serviceType}
                options={SERVICE_TYPES}
                onChange={(val) => updateField('serviceType', val)}
                disabled={isReadOnly}
                placeholder="Select service type"
              />
            </div>
          </div>

          {/* Additional Services Section */}
          <div className="mt-5 pt-3 border-t border-slate-100">
            <label className="block text-[11px] font-bold text-slate-600 tracking-wide mb-2">Additional Services</label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {SERVICE_TYPES.map(service => (
                <label key={service.value} className={`flex items-center gap-2 p-2 text-xs font-medium text-slate-700 bg-slate-50/40 border border-slate-200 rounded-lg hover:bg-slate-50 transition cursor-pointer ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <input 
                    type="checkbox" 
                    disabled={isReadOnly}
                    checked={formData.additionalServices.includes(service.value)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData(prev => ({ ...prev, additionalServices: [...prev.additionalServices, service.value] }));
                      } else {
                        setFormData(prev => ({ ...prev, additionalServices: prev.additionalServices.filter(s => s !== service.value) }));
                      }
                    }}
                    className="rounded text-blue-600 accent-blue-600"
                  />
                  <span className="truncate">{service.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Card 4: Notes */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/70 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5 text-blue-700 font-extrabold text-xs tracking-wider uppercase">
            <div className="p-1 bg-blue-50 rounded-md"><Layers size={14} /></div>
            <span>Notes</span>
          </div>
          
          <div>
            <label className="block text-[11px] font-bold text-slate-600 tracking-wide mb-1.5">Narrative *</label>
            <textarea 
              value={formData.narrative} 
              onChange={(e) => updateField('narrative', e.target.value)} 
              disabled={isReadOnly} 
              rows={6} 
              placeholder="Type or dictate full case narration..." 
              className="w-full p-4 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 resize-none text-sm bg-white text-slate-800 placeholder-slate-400 font-medium" 
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-2">
            {/* ✅ Updated: Team Member Field with Online/Offline support */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 tracking-wide mb-1.5 flex items-center gap-1">
                <Users size={12} /> Team Member
              </label>
              {isOnline && teamMembers.length > 0 ? (
                <div className="relative">
                  <select
                    value={formData.teamMember || ''}
                    onChange={(e) => updateField('teamMember', e.target.value)}
                    disabled={isReadOnly || teamMembersLoading}
                    className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 font-medium transition shadow-2xs appearance-none pr-10"
                  >
                    <option value="">Select team member...</option>
                    {teamMemberOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              ) : (
                <input 
                  type="text"
                  value={formData.teamMember || ''}
                  onChange={(e) => updateField('teamMember', e.target.value)}
                  disabled={isReadOnly}
                  placeholder={isOnline ? 'No team members found' : 'Enter team member name'}
                  className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white disabled:bg-slate-100/80 focus:outline-none focus:border-blue-500 transition shadow-2xs font-medium"
                />
              )}
              <p className="text-[10px] text-slate-400 mt-1">
                {isOnline ? 'Select from available team members' : 'Offline: Enter team member name manually'}
              </p>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 tracking-wide mb-1.5">Other Attendees</label>
              <textarea 
                value={formData.otherAttendees || ''} 
                onChange={(e) => updateField('otherAttendees', e.target.value)} 
                disabled={isReadOnly} 
                rows={2} 
                className="w-full px-4 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 font-medium transition resize-none shadow-2xs" 
                placeholder="Enter comma separated attendee names..." 
              />
            </div>
          </div>
        </div>

        {/* Card 5: Checkbox Panel */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/70 shadow-xs space-y-3.5">
          <div 
            onClick={() => !isReadOnly && updateField('notifyTeam', !formData.notifyTeam)}
            className={`flex items-start gap-4 bg-slate-50/50 hover:bg-slate-50 border border-slate-200/50 p-4 rounded-xl select-none transition-all group ${isReadOnly ? 'cursor-not-allowed' : 'cursor-pointer'}`}
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
                <Bell size={13} className="text-slate-400" /> Notify All Team Members About This Note
              </span>
              <span className="text-[10px] font-medium text-slate-400/90 mt-0.5">Broadcast an automated system alert to connected caseworkers regarding this update.</span>
            </div>
          </div>

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
                <ShieldCheck size={13} className="text-slate-400" /> Mark as completed (And lock this Note as Read Only)
              </span>
              <span className="text-[10px] font-medium text-slate-400/90 mt-0.5">Freezes this record asset. Safe lock mechanism prevents further mutations.</span>
            </div>
          </div>
        </div>

        {/* Card 6: Audit Logs */}
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

        {/* Bottom Action Buttons */}
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