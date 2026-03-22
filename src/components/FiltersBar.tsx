interface FiltersBarProps {
  favoritesOnly: boolean;
  onFavoritesChange: (value: boolean) => void;
}

export default function FiltersBar({ favoritesOnly, onFavoritesChange }: FiltersBarProps): React.ReactElement {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
        <input
          type="checkbox"
          checked={favoritesOnly}
          onChange={(e) => onFavoritesChange(e.target.checked)}
          data-testid="favorites-filter"
        />
        Только избранные
      </label>
    </div>
  );
}
