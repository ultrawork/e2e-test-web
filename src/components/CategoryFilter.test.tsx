import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CategoryFilter from './CategoryFilter';
import type { Category } from '@/types';

const categories: Category[] = [
  { id: '1', name: 'Work', color: '#ff0000', createdAt: '' },
  { id: '2', name: 'Personal', color: '#00ff00', createdAt: '' },
];

describe('CategoryFilter', () => {
  it('has data-testid="category-filter"', () => {
    render(<CategoryFilter categories={categories} selectedId={null} onChange={() => {}} />);
    expect(screen.getByTestId('category-filter')).toBeInTheDocument();
  });

  it('renders "Все" chip and category chips', () => {
    render(<CategoryFilter categories={categories} selectedId={null} onChange={() => {}} />);
    expect(screen.getByText('Все')).toBeInTheDocument();
    expect(screen.getByText('Work')).toBeInTheDocument();
    expect(screen.getByText('Personal')).toBeInTheDocument();
  });

  it('calls onChange(null) when "Все" is clicked', () => {
    const onChange = vi.fn();
    render(<CategoryFilter categories={categories} selectedId="1" onChange={onChange} />);
    fireEvent.click(screen.getByText('Все'));
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('calls onChange with category id when category chip is clicked', () => {
    const onChange = vi.fn();
    render(<CategoryFilter categories={categories} selectedId={null} onChange={onChange} />);
    fireEvent.click(screen.getByText('Work'));
    expect(onChange).toHaveBeenCalledWith('1');
  });
});
