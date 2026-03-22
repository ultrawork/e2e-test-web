import type { Category } from '@/types';
import { getContrastColor } from './CategoryBadge';

interface CategoryFilterProps {
  categories: Category[];
  selectedId: string | null;
  onChange: (id: string | null) => void;
}

export default function CategoryFilter({ categories, selectedId, onChange }: CategoryFilterProps): React.ReactElement {
  const chipBase: React.CSSProperties = {
    display: 'inline-block',
    padding: '0.25rem 0.75rem',
    borderRadius: '9999px',
    fontSize: '0.85rem',
    cursor: 'pointer',
    border: '2px solid transparent',
    marginRight: '0.5rem',
    marginBottom: '0.5rem',
  };

  return (
    <div data-testid="category-filter" style={{ marginBottom: '1rem' }}>
      <button
        type="button"
        onClick={() => onChange(null)}
        style={{
          ...chipBase,
          backgroundColor: selectedId === null ? '#333' : '#eee',
          color: selectedId === null ? '#fff' : '#333',
          border: selectedId === null ? '2px solid #333' : '2px solid transparent',
        }}
      >
        Все
      </button>
      {categories.map((cat) => {
        const isActive = selectedId === cat.id;
        return (
          <button
            type="button"
            key={cat.id}
            onClick={() => onChange(cat.id)}
            style={{
              ...chipBase,
              backgroundColor: cat.color,
              color: getContrastColor(cat.color),
              border: isActive ? `2px solid #333` : '2px solid transparent',
              outline: isActive ? '2px solid #333' : 'none',
              outlineOffset: '1px',
            }}
          >
            {cat.name}
          </button>
        );
      })}
    </div>
  );
}
