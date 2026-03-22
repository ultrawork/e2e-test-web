import type { Category } from '@/types';

/** Returns '#000' or '#fff' based on background luminance for optimal contrast. */
export function getContrastColor(hex: string): '#000' | '#fff' {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
  return luminance > 128 ? '#000' : '#fff';
}

interface CategoryBadgeProps {
  category: Category;
}

export default function CategoryBadge({ category }: CategoryBadgeProps): React.ReactElement {
  return (
    <span
      data-testid="category-badge"
      style={{
        display: 'inline-block',
        padding: '0.15rem 0.5rem',
        borderRadius: '9999px',
        fontSize: '0.75rem',
        fontWeight: 600,
        backgroundColor: category.color,
        color: getContrastColor(category.color),
        marginRight: '0.25rem',
      }}
    >
      {category.name}
    </span>
  );
}
