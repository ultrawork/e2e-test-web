import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CategoryManager from './CategoryManager';
import type { Category } from '@/types';
import * as api from '@/lib/api';

vi.mock('@/lib/api', () => ({
  createCategory: vi.fn(),
  updateCategory: vi.fn(),
  deleteCategory: vi.fn(),
}));

const categories: Category[] = [
  { id: '1', name: 'Work', color: '#ff0000', createdAt: '' },
  { id: '2', name: 'Personal', color: '#00ff00', createdAt: '' },
];

describe('CategoryManager', () => {
  const onRefresh = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('has data-testid="category-manager"', () => {
    render(<CategoryManager categories={categories} onRefresh={onRefresh} />);
    expect(screen.getByTestId('category-manager')).toBeInTheDocument();
  });

  it('renders category list', () => {
    render(<CategoryManager categories={categories} onRefresh={onRefresh} />);
    expect(screen.getByText('Work')).toBeInTheDocument();
    expect(screen.getByText('Personal')).toBeInTheDocument();
  });

  it('shows empty message when no categories', () => {
    render(<CategoryManager categories={[]} onRefresh={onRefresh} />);
    expect(screen.getByText('Нет категорий')).toBeInTheDocument();
  });

  it('shows form when "Добавить" is clicked', () => {
    render(<CategoryManager categories={categories} onRefresh={onRefresh} />);
    fireEvent.click(screen.getByText('Добавить'));
    expect(screen.getByTestId('category-name-input')).toBeInTheDocument();
    expect(screen.getByTestId('category-color-input')).toBeInTheDocument();
  });

  it('validates empty name', () => {
    render(<CategoryManager categories={categories} onRefresh={onRefresh} />);
    fireEvent.click(screen.getByText('Добавить'));
    fireEvent.click(screen.getByText('Создать'));
    expect(screen.getByText('Название: от 1 до 30 символов')).toBeInTheDocument();
  });

  it('validates invalid hex color', () => {
    render(<CategoryManager categories={categories} onRefresh={onRefresh} />);
    fireEvent.click(screen.getByText('Добавить'));
    fireEvent.change(screen.getByTestId('category-name-input'), { target: { value: 'Test' } });
    fireEvent.change(screen.getByTestId('category-color-input'), { target: { value: 'invalid' } });
    fireEvent.click(screen.getByText('Создать'));
    expect(screen.getByText('Цвет должен быть в формате #RRGGBB')).toBeInTheDocument();
  });

  it('calls createCategory and onRefresh on valid submission', async () => {
    vi.mocked(api.createCategory).mockResolvedValue({ id: '3', name: 'New', color: '#0000ff', createdAt: '' });
    render(<CategoryManager categories={categories} onRefresh={onRefresh} />);
    fireEvent.click(screen.getByText('Добавить'));
    fireEvent.change(screen.getByTestId('category-name-input'), { target: { value: 'New' } });
    fireEvent.click(screen.getByText('Создать'));
    await waitFor(() => {
      expect(api.createCategory).toHaveBeenCalledWith({ name: 'New', color: '#3b82f6' });
      expect(onRefresh).toHaveBeenCalled();
    });
  });

  it('calls deleteCategory and onRefresh when delete is clicked', async () => {
    vi.mocked(api.deleteCategory).mockResolvedValue(undefined);
    render(<CategoryManager categories={categories} onRefresh={onRefresh} />);
    const deleteButtons = screen.getAllByText('Удалить');
    fireEvent.click(deleteButtons[0]);
    await waitFor(() => {
      expect(api.deleteCategory).toHaveBeenCalledWith('1');
      expect(onRefresh).toHaveBeenCalled();
    });
  });

  it('fills form when edit is clicked', () => {
    render(<CategoryManager categories={categories} onRefresh={onRefresh} />);
    const editButtons = screen.getAllByText('Изменить');
    fireEvent.click(editButtons[0]);
    expect(screen.getByTestId('category-name-input')).toHaveValue('Work');
    expect(screen.getByTestId('category-color-input')).toHaveValue('#ff0000');
    expect(screen.getByText('Сохранить')).toBeInTheDocument();
  });

  it('calls updateCategory on edit submission', async () => {
    vi.mocked(api.updateCategory).mockResolvedValue({ id: '1', name: 'Updated', color: '#ff0000', createdAt: '' });
    render(<CategoryManager categories={categories} onRefresh={onRefresh} />);
    const editButtons = screen.getAllByText('Изменить');
    fireEvent.click(editButtons[0]);
    fireEvent.change(screen.getByTestId('category-name-input'), { target: { value: 'Updated' } });
    fireEvent.click(screen.getByText('Сохранить'));
    await waitFor(() => {
      expect(api.updateCategory).toHaveBeenCalledWith('1', { name: 'Updated', color: '#ff0000' });
      expect(onRefresh).toHaveBeenCalled();
    });
  });
});
