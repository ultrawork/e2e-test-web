import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import CategoryBadge, { getContrastColor } from './CategoryBadge';
import type { Category } from '@/types';

describe('getContrastColor', () => {
  it('returns #000 for light colors (white)', () => {
    expect(getContrastColor('#ffffff')).toBe('#000');
  });

  it('returns #fff for dark colors (black)', () => {
    expect(getContrastColor('#000000')).toBe('#fff');
  });

  it('returns #000 for yellow (bright)', () => {
    expect(getContrastColor('#ffff00')).toBe('#000');
  });

  it('returns #fff for dark blue', () => {
    expect(getContrastColor('#000080')).toBe('#fff');
  });

  it('returns #fff for red (#ff0000, luminance ~76)', () => {
    expect(getContrastColor('#ff0000')).toBe('#fff');
  });

  it('returns #000 for light green (#90ee90)', () => {
    expect(getContrastColor('#90ee90')).toBe('#000');
  });
});

describe('CategoryBadge', () => {
  const category: Category = { id: '1', name: 'Work', color: '#3b82f6', createdAt: '' };

  it('renders category name', () => {
    render(<CategoryBadge category={category} />);
    expect(screen.getByText('Work')).toBeInTheDocument();
  });

  it('has data-testid="category-badge"', () => {
    render(<CategoryBadge category={category} />);
    expect(screen.getByTestId('category-badge')).toBeInTheDocument();
  });

  it('applies background color from category', () => {
    render(<CategoryBadge category={category} />);
    const badge = screen.getByTestId('category-badge');
    expect(badge.style.backgroundColor).toBe('rgb(59, 130, 246)');
  });

  it('applies contrast text color', () => {
    render(<CategoryBadge category={category} />);
    const badge = screen.getByTestId('category-badge');
    // #3b82f6 has luminance ~125, so text should be white
    expect(badge.style.color).toBe('rgb(255, 255, 255)');
  });
});
