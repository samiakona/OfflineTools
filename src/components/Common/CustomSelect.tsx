import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface CustomSelectProps {
  value: string | number;
  options: { value: string | number; label: string }[];
  onChange: (value: any) => void;
  disabled?: boolean;
  placeholder?: string;
  icon?: React.ReactNode;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({ 
  value, options, onChange, disabled, placeholder, icon 
}) => {
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