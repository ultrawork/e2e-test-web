interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function SearchBar({ value, onChange, placeholder = "Поиск заметок..." }: SearchBarProps): React.JSX.Element {
  return (
    <search style={{ marginBottom: '1rem' }}>
      <label htmlFor="notes-search" style={{
        position: 'absolute',
        width: '1px',
        height: '1px',
        padding: 0,
        margin: '-1px',
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
        borderWidth: 0,
      }}>
        Поиск заметок
      </label>
      <input
        id="notes-search"
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label="Поиск заметок"
        style={{
          width: '100%',
          padding: '0.5rem 0.75rem',
          fontSize: '1rem',
          border: '1px solid #ccc',
          borderRadius: '0.375rem',
          boxSizing: 'border-box',
        }}
      />
    </search>
  );
}
