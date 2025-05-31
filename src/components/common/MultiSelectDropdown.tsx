import { useEffect, useRef, useState } from "react";

export interface MultiSelectDropdownOption {
  value: string;
  label: string;
}

export interface MultiSelectDropdownProps {
  options: MultiSelectDropdownOption[];
  selected: string[];
  setSelected: React.Dispatch<React.SetStateAction<string[]>>;
  allLabel?: string;
  className?: string;
  label?: string; // for aria-label or accessibility
}

export function MultiSelectDropdown({
  options,
  selected,
  setSelected,
  allLabel = "Todos",
  className = "",
  label,
}: MultiSelectDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Only auto-select all on first mount, not after user clears selection
  const didAutoSelect = useRef(false);
  useEffect(() => {
    if (!didAutoSelect.current && options.length > 0 && selected.length === 0) {
      setSelected(options.map((opt) => opt.value));
      didAutoSelect.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options]);

  // Keyboard accessibility: close on Escape
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    if (open) document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const allSelected = options.length > 0 && selected.length === options.length;
  const toggleAll = () => {
    if (allSelected) setSelected([]);
    else setSelected(options.map((opt) => opt.value));
  };
  const toggleOption = (value: string) => {
    setSelected((prev: string[]) => {
      if (prev.includes(value)) {
        return prev.filter((v) => v !== value);
      } else {
        const newSelected = [...prev, value];
        if (newSelected.length === options.length) return options.map((opt) => opt.value);
        return newSelected;
      }
    });
  };

  // For checkmark icon
  const CheckIcon = (
    <svg className="w-4 h-4 text-brand-500" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
  );
  // Chevron icon
  const ChevronIcon = (
    <svg className={`w-4 h-4 ml-2 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
  );

  // Button label text
  let buttonText = allLabel;
  if (selected.length === 0) buttonText = allLabel;
  else if (allSelected) buttonText = allLabel;
  else if (selected.length === 1) {
    const found = options.find((o) => o.value === selected[0]);
    buttonText = found ? found.label : allLabel;
  } else {
    buttonText = `${selected.length} seleccionados`;
  }

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        type="button"
        className={`w-48 py-2 px-3 border border-gray-300 rounded-lg bg-white dark:bg-gray-900 dark:text-white/90 text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-brand-400 ${open ? "ring-2 ring-brand-400" : ""}`}
        onClick={() => setOpen((o) => !o)}
        tabIndex={0}
        aria-label={label || allLabel}
      >
        <span className="truncate flex-1 text-gray-600 dark:text-gray-300">{buttonText}</span>
        {ChevronIcon}
      </button>
      {open && (
        <div className="absolute z-40 mt-1 w-56 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-lg max-h-64 overflow-auto animate-fade-in">
          <label className="flex items-center px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer font-medium text-gray-700 dark:text-white/90">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={toggleAll}
              className="mr-2 accent-brand-500"
            />
            <span className="truncate flex-1">{allLabel}</span>
            {allSelected && CheckIcon}
          </label>
          <div className="border-t border-gray-100 dark:border-gray-800 my-1" />
          {options.map((opt) => (
            <label key={opt.value} className="flex items-center px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer text-gray-700 dark:text-gray-200">
              <input
                type="checkbox"
                checked={selected.includes(opt.value)}
                onChange={() => toggleOption(opt.value)}
                className="mr-2 accent-brand-500"
              />
              <span className="truncate flex-1">{opt.label}</span>
              {selected.includes(opt.value) && CheckIcon}
            </label>
          ))}
        </div>
      )}
    </div>
  );
} 