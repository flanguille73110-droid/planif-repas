import React, { useState, useMemo, useRef, useEffect } from 'react';

export interface SearchableSelectOption {
  id: string;
  title: string;
  group?: string;
  badge?: string;
  badgeColor?: string;
}

interface SearchableSelectProps {
  options: SearchableSelectOption[];
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  placeholder?: string;
  selectedClassName?: string;
  buttonClassName?: string;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  value,
  onChange,
  placeholder,
  selectedClassName,
  buttonClassName
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeGroupFilter, setActiveGroupFilter] = useState<string>('all');
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Detect unique groups if any
  const availableGroups = useMemo(() => {
    const groups = new Set<string>();
    options.forEach(opt => {
      if (opt.group) groups.add(opt.group);
    });
    return Array.from(groups);
  }, [options]);

  const filteredOptions = useMemo(() => {
    return options.filter(option => {
      const matchesSearch =
        option.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (option.group && option.group.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (option.badge && option.badge.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesGroup =
        activeGroupFilter === 'all' || option.group === activeGroupFilter;

      return matchesSearch && matchesGroup;
    });
  }, [options, searchTerm, activeGroupFilter]);

  const selectedOption = useMemo(() => {
    return options.find(option => option.id === value);
  }, [options, value]);

  const handleSelect = (optionId: string | undefined) => {
    onChange(optionId);
    setIsOpen(false);
    setSearchTerm('');
    setActiveGroupFilter('all');
  };

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
  }, [wrapperRef]);

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <button
        type="button"
        className={`w-full border rounded-xl p-2.5 sm:p-3 text-left flex items-center justify-between transition-all ${
          buttonClassName || 'bg-white border-gray-200 hover:border-purple-300 shadow-2xs'
        }`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-1.5 truncate">
          {selectedOption?.badge && (
            <span
              className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0 ${
                selectedOption.badge.toLowerCase().includes('régime')
                  ? 'bg-purple-100 text-purple-800 border border-purple-200'
                  : 'bg-blue-100 text-blue-800 border border-blue-200'
              }`}
            >
              {selectedOption.badge}
            </span>
          )}
          <span className={`truncate ${value && selectedClassName ? selectedClassName : 'text-gray-700'}`}>
            {selectedOption?.title || placeholder || 'Sélectionner...'}
          </span>
        </div>
        <svg
          className={`w-4 h-4 text-gray-400 shrink-0 ml-1 transform transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden min-w-[240px]">
          <div className="p-2 border-b border-gray-100 space-y-2 bg-gray-50/70">
            <input
              type="text"
              placeholder="Rechercher une recette..."
              className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              autoFocus
            />

            {availableGroups.length > 1 && (
              <div className="flex items-center gap-1 overflow-x-auto pb-0.5 custom-scrollbar">
                <button
                  type="button"
                  onClick={() => setActiveGroupFilter('all')}
                  className={`text-[10px] font-black px-2 py-0.5 rounded-lg transition-all shrink-0 cursor-pointer ${
                    activeGroupFilter === 'all'
                      ? 'bg-purple-600 text-white shadow-2xs'
                      : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Tous ({options.length})
                </button>
                {availableGroups.map(grp => {
                  const count = options.filter(o => o.group === grp).length;
                  const isRegime = grp.toLowerCase().includes('régime');
                  return (
                    <button
                      key={grp}
                      type="button"
                      onClick={() => setActiveGroupFilter(grp)}
                      className={`text-[10px] font-black px-2 py-0.5 rounded-lg transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
                        activeGroupFilter === grp
                          ? isRegime
                            ? 'bg-purple-600 text-white shadow-2xs'
                            : 'bg-blue-600 text-white shadow-2xs'
                          : isRegime
                          ? 'bg-purple-50 border border-purple-200 text-purple-800 hover:bg-purple-100'
                          : 'bg-blue-50 border border-blue-200 text-blue-800 hover:bg-blue-100'
                      }`}
                    >
                      <span>{isRegime ? '🥗' : '📖'}</span>
                      <span>{grp} ({count})</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <ul className="max-h-60 overflow-y-auto divide-y divide-gray-50 text-xs">
            <li
              className="px-3.5 py-2 hover:bg-gray-50 cursor-pointer text-gray-400 font-bold flex items-center justify-between"
              onClick={() => handleSelect(undefined)}
            >
              <span>— Vider / Aucun —</span>
              <span className="text-[10px]">✕</span>
            </li>

            {filteredOptions.length === 0 ? (
              <li className="px-4 py-4 text-center text-gray-400 text-xs font-medium italic">
                Aucune recette trouvée
              </li>
            ) : (
              filteredOptions.map(option => {
                const isSelected = value === option.id;
                const isRegime = option.badge?.toLowerCase().includes('régime') || option.group?.toLowerCase().includes('régime');

                return (
                  <li
                    key={option.id}
                    className={`px-3.5 py-2 hover:bg-purple-50/60 cursor-pointer transition-colors flex items-center justify-between gap-2 ${
                      isSelected ? 'bg-purple-50 font-black text-purple-900' : 'text-gray-700'
                    }`}
                    onClick={() => handleSelect(option.id)}
                  >
                    <span className="truncate">{option.title}</span>
                    {option.badge && (
                      <span
                        className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0 ${
                          isRegime
                            ? 'bg-purple-100 text-purple-800 border border-purple-200'
                            : 'bg-blue-100 text-blue-800 border border-blue-200'
                        }`}
                      >
                        {option.badge}
                      </span>
                    )}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
};
