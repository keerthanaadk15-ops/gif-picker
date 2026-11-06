'use client';

import { useRef } from 'react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="search-bar">
      <span className="search-bar__icon" aria-hidden="true">🔍</span>
      <input
        ref={inputRef}
        type="search"
        className="search-bar__input"
        placeholder="Search for GIFs…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Search GIFs"
        autoComplete="off"
        autoFocus
      />
      {value && (
        <button
          className="search-bar__clear"
          onClick={() => { onChange(''); inputRef.current?.focus(); }}
          aria-label="Clear search"
        >
          ×
        </button>
      )}
    </div>
  );
}
