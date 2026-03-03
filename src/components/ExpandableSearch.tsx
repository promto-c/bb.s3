import React from 'react';
import { Search, X } from 'lucide-react';

interface ExpandableSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  title?: string;
  onOpenChange?: (isOpen: boolean) => void;
}

const ExpandableSearch: React.FC<ExpandableSearchProps> = ({ value, onChange, placeholder = 'Search...', title = 'Search', onOpenChange }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const setOpen = (next: boolean) => {
    setIsOpen(next);
    onOpenChange?.(next);
  };

  const open = () => {
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 10);
  };

  const close = () => {
    onChange('');
    setOpen(false);
  };

  return (
    <>
      <div className={`expandable-search ${isOpen ? 'open' : ''}`}>
        <Search className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-[#444] pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          className="expandable-search-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => { if (!value) setOpen(false); }}
          onKeyDown={(e) => { if (e.key === 'Escape') { close(); inputRef.current?.blur(); } }}
        />
      </div>
      <button
        onClick={() => { if (isOpen) close(); else open(); }}
        className={`text-[#555] hover:text-white transition-colors p-1 ${isOpen ? 'text-white' : ''}`}
        title={isOpen ? 'Cancel' : title}
      >
        {isOpen ? <X className="w-3.5 h-3.5" /> : <Search className="w-3.5 h-3.5" />}
      </button>
    </>
  );
};

export default ExpandableSearch;
