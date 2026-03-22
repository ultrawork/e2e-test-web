import type { Category } from '@/types/category';

interface CategoryFilterProps {
  categories: Category[];
  selectedCategoryId: string | null;
  onChange: (id: string | null) => void;
}

const baseButtonStyle: React.CSSProperties = {
  padding: '0.5rem 0.75rem',
  border: '1px solid #ccc',
  borderRadius: '999px',
  backgroundColor: '#fff',
  color: '#222',
  cursor: 'pointer',
};

const activeButtonStyle: React.CSSProperties = {
  backgroundColor: '#222',
  color: '#fff',
  borderColor: '#222',
};

/**
 * Renders category filter buttons with an accessible pressed state.
 */
export default function CategoryFilter({
  categories,
  selectedCategoryId,
  onChange,
}: CategoryFilterProps): React.ReactElement {
  return (
    <div data-testid="category-filter" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
      <button
        type="button"
        data-testid="category-filter-all"
        aria-pressed={selectedCategoryId === null}
        onClick={() => onChange(null)}
        style={{
          ...baseButtonStyle,
          ...(selectedCategoryId === null ? activeButtonStyle : null),
        }}
      >
        Все
      </button>
      {categories.map((category) => {
        const isActive = selectedCategoryId === category.id;

        return (
          <button
            key={category.id}
            type="button"
            data-category-id={category.id}
            aria-pressed={isActive}
            onClick={() => onChange(category.id)}
            style={{
              ...baseButtonStyle,
              ...(isActive ? activeButtonStyle : null),
            }}
          >
            {category.name}
          </button>
        );
      })}
    </div>
  );
}
