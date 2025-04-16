import React, { useState, useRef, useEffect } from 'react';
import { Check } from 'lucide-react';

interface ComboboxInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  icon?: React.ReactNode;
  required?: boolean;
}

const ComboboxInput: React.FC<ComboboxInputProps> = ({
  id,
  value,
  onChange,
  options,
  placeholder,
  icon,
  required = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const [filteredOptions, setFilteredOptions] = useState(options);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    const filtered = options.filter(option =>
      option.toLowerCase().includes(inputValue.toLowerCase())
    );
    setFilteredOptions(filtered);
  }, [inputValue, options]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue);
    setIsOpen(true);
  };

  const handleOptionClick = (option: string) => {
    setInputValue(option);
    onChange(option);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {icon}
          </div>
        )}
        <input
          type="text"
          id={id}
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          className={`appearance-none block w-full ${
            icon ? 'pl-10' : 'pl-3'
          } pr-3 py-2 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
          placeholder={placeholder}
          required={required}
        />
      </div>
      
      {isOpen && filteredOptions.length > 0 && (
        <div className="absolute z-10 mt-1 w-full bg-white rounded-md shadow-lg max-h-60 overflow-auto">
          <ul className="py-1">
            {filteredOptions.map((option) => (
              <li
                key={option}
                className={`cursor-pointer flex items-center px-3 py-2 text-sm hover:bg-gray-100 ${
                  option === value ? 'bg-blue-50' : ''
                }`}
                onClick={() => handleOptionClick(option)}
              >
                <span className="flex-grow">{option}</span>
                {option === value && (
                  <Check size={16} className="text-blue-500" />
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ComboboxInput;