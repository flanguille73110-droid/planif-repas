import React, { useState, useMemo, useRef, useEffect } from 'react';

interface SearchableSelectProps {
  options: { id: string; title: string }[];
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  placeholder?: string;
  selectedClassName?: string;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({ options, value, onChange, placeholder, selectedClassName }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  const filteredOptions = useMemo(() => {
    return options.filter(option =>
      option.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [options, searchTerm]);

  const selectedOption = useMemo(() => {
    return options.find(option => option.id === value);
  }, [options, value]);

  const handleSelect = (optionId: string | undefined) => {
    onChange(optionId);
    setIsOpen(false);
    setSearchTerm('');
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [wrapperRef]);

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <button
        type="button"
        className="w-full bg-white border border-gray-200 rounded-xl p-3 text-left flex items-center justify-between"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={`truncate ${value && selectedClassName ? selectedClassName : ''}`}>
          {selectedOption?.title || placeholder || 'Sélectionner...'}
        </span>
        <svg className={`w-5 h-5 text-gray-400 transform transition-transform ${isOpen ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg">
          <div className="p-2">
            <input
              type="text"
              placeholder="Rechercher..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <ul className="max-h-60 overflow-y-auto">
            <li
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-gray-500"
              onClick={() => handleSelect(undefined)}
            >
              Vide
            </li>
            {filteredOptions.map(option => (
              <li
                key={option.id}
                className={`px-4 py-2 hover:bg-gray-100 cursor-pointer ${value === option.id ? 'font-bold text-purple-600' : ''}`}
                onClick={() => handleSelect(option.id)}
              >
                {option.title}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
