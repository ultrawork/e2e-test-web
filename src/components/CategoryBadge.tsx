import { Category } from '@/types';

interface CategoryBadgeProps {
  category: Category;
  size?: 'sm' | 'md';
  onClick?: (category: Category) => void;
}

/** Returns '#000' for light backgrounds, '#fff' for dark ones (YIQ formula). */
function getContrastYIQ(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? '#000' : '#fff';
}

export default function CategoryBadge({ category, size = 'md', onClick }: CategoryBadgeProps): React.ReactElement {
  const isSmall = size === 'sm';

  return (
    <span
      data-testid="category-badge"
      aria-label={`Category: ${category.name}`}
      title={category.name}
      onClick={onClick ? () => onClick(category) : undefined}
      style={{
        backgroundColor: category.color,
        color: getContrastYIQ(category.color),
        borderRadius: 9999,
        display: 'inline-block',
        padding: isSmall ? '0.1rem 0.5rem' : '0.25rem 0.75rem',
        fontSize: isSmall ? '0.75rem' : '0.875rem',
        lineHeight: isSmall ? '1rem' : '1.25rem',
        cursor: onClick ? 'pointer' : undefined,
      }}
    >
      {category.name}
    </span>
  );
}
