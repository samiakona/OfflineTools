import React, { useState, useRef, useEffect } from 'react';
import { X, ChevronDown, Check } from 'lucide-react';

interface MultiSelectInputProps {
  label: string;
  values: string[];
  options: string[]; // Make sure this is always an array
  onChange: (values: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  isLoading?: boolean;
}

export const MultiSelectInput: React.FC<MultiSelectInputProps> = ({
  label,
  values = [], // Default to empty array
  options = [], // Default to empty array to prevent undefined
  onChange,
  placeholder = 'Select options...',
  disabled = false,
  className = '',
  isLoading = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Safe filtering with null/undefined check
  const filteredOptions = Array.isArray(options) 
    ? options.filter(opt => 
        opt && typeof opt === 'string' && 
        opt.toLowerCase().includes((searchTerm || '').toLowerCase())
      )
    : [];

  const handleToggle = (option: string) => {
    if (!option) return;
    const currentValues = Array.isArray(values) ? values : [];
    if (currentValues.includes(option)) {
      onChange(currentValues.filter(v => v !== option));
    } else {
      onChange([...currentValues, option]);
    }
  };

  const handleRemove = (valueToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const currentValues = Array.isArray(values) ? values : [];
    onChange(currentValues.filter(v => v !== valueToRemove));
  };

  const safeValues = Array.isArray(values) ? values : [];
  const displayText = safeValues.length > 0 
    ? `${safeValues.length} selected` 
    : placeholder;

  return (
    <div className={className} ref={dropdownRef}>
      <label className="block text-[11px] font-bold text-slate-600 tracking-wide mb-1.5">
        {label}
      </label>
      
      <div className="relative">
        {/* Dropdown Trigger */}
        <div
          onClick={() => !disabled && !isLoading && setIsOpen(!isOpen)}
          className={`w-full px-4 py-2.5 text-sm border rounded-xl bg-white flex items-center justify-between cursor-pointer transition-all shadow-2xs ${
            disabled || isLoading 
              ? 'bg-slate-100/80 cursor-not-allowed opacity-70' 
              : 'hover:border-slate-300 focus:border-blue-500'
          } ${isOpen ? 'border-blue-500 ring-4 ring-blue-500/5' : 'border-slate-200'}`}
        >
          <span className={`font-medium ${safeValues.length === 0 ? 'text-slate-400' : 'text-slate-700'}`}>
            {isLoading ? 'Loading...' : displayText}
          </span>
          <ChevronDown 
            size={16} 
            className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
          />
        </div>

        {/* Selected Tags */}
        {safeValues.length > 0 && !disabled && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {safeValues.map((value, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg text-xs font-medium"
              >
                {value}
                <button
                  type="button"
                  onClick={(e) => handleRemove(value, e)}
                  className="hover:text-red-600 transition-colors"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Dropdown Menu */}
        {isOpen && !disabled && !isLoading && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-hidden flex flex-col">
            {/* Search Input */}
            <div className="p-2 border-b border-slate-100">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search..."
                className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/5"
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            {/* Options List */}
            <div className="overflow-y-auto flex-1 p-1">
              {filteredOptions.length === 0 ? (
                <div className="px-3 py-2 text-sm text-slate-400 text-center">
                  {options.length === 0 ? 'No options available' : 'No results found'}
                </div>
              ) : (
                filteredOptions.map((option) => (
                  <div
                    key={option}
                    onClick={() => handleToggle(option)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors ${
                      safeValues.includes(option)
                        ? 'bg-blue-50 text-blue-700'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className={`w-4 h-4 border rounded flex items-center justify-center transition-colors ${
                      safeValues.includes(option)
                        ? 'border-blue-600 bg-blue-600'
                        : 'border-slate-300'
                    }`}>
                      {safeValues.includes(option) && (
                        <Check size={10} className="text-white" />
                      )}
                    </div>
                    <span>{option}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};