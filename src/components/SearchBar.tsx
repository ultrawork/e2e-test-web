interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function SearchBar({ value, onChange, placeholder = 'Поиск заметок...' }: SearchBarProps): React.ReactElement {
  return (
    <search role="search" aria-label="Поиск заметок" style={{ marginBottom: '1rem' }}>
      <label htmlFor="search-notes" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)' }}>
        Search notes
      </label>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <input
          id="search-notes"
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={{ flex: 1, padding: '0.5rem' }}
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            aria-label="Очистить поиск"
            style={{ padding: '0.25rem 0.5rem', cursor: 'pointer' }}
          >
            ×
          </button>
        )}
      </div>
    </search>
  );
}
