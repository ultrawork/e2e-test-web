import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CategoryFilter from '@/components/CategoryFilter';
import type { Category } from '@/types/category';

const categories: Category[] = [
  { id: 'work', name: 'Работа' },
  { id: 'personal', name: 'Личное' },
];

describe('CategoryFilter', () => {
  it('renders container, all button and category names', () => {
    render(
      <CategoryFilter
        categories={categories}
        selectedCategoryId={null}
        onChange={() => {}}
      />,
    );

    expect(screen.getByTestId('category-filter')).toBeInTheDocument();
    expect(screen.getByTestId('category-filter-all')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Работа' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Личное' })).toBeInTheDocument();
  });

  it('calls onChange for category and all buttons', async () => {
    const user = userEvent.setup();
    const handleChange = jest.fn();

    render(
      <CategoryFilter
        categories={categories}
        selectedCategoryId={null}
        onChange={handleChange}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Работа' }));
    expect(handleChange).toHaveBeenCalledWith('work');

    await user.click(screen.getByTestId('category-filter-all'));
    expect(handleChange).toHaveBeenCalledWith(null);
  });

  it('sets correct aria-pressed state for active button', () => {
    const { rerender } = render(
      <CategoryFilter
        categories={categories}
        selectedCategoryId={null}
        onChange={() => {}}
      />,
    );

    expect(screen.getByTestId('category-filter-all')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Работа' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: 'Личное' })).toHaveAttribute('aria-pressed', 'false');

    rerender(
      <CategoryFilter
        categories={categories}
        selectedCategoryId="personal"
        onChange={() => {}}
      />,
    );

    expect(screen.getByTestId('category-filter-all')).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: 'Работа' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: 'Личное' })).toHaveAttribute('aria-pressed', 'true');
  });
});
