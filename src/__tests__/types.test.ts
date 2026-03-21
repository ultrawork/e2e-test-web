import { describe, it, expect } from 'vitest';
import type { Category, Note } from '@/types';

describe('Category type', () => {
  it('should allow creating a Category with required fields', () => {
    const category: Category = {
      id: 1,
      name: 'Work',
      color: '#ff0000',
    };

    expect(category.id).toBe(1);
    expect(category.name).toBe('Work');
    expect(category.color).toBe('#ff0000');
  });

  it('should allow optional timestamp fields', () => {
    const category: Category = {
      id: 2,
      name: 'Personal',
      color: '#00ff00',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-02T00:00:00Z',
    };

    expect(category.createdAt).toBe('2024-01-01T00:00:00Z');
    expect(category.updatedAt).toBe('2024-01-02T00:00:00Z');
  });
});

describe('Note type', () => {
  it('should allow creating a Note with required fields', () => {
    const note: Note = {
      id: 1,
      text: 'Test note',
      categories: [],
    };

    expect(note.id).toBe(1);
    expect(note.text).toBe('Test note');
    expect(note.categories).toEqual([]);
  });

  it('should allow Note with categories', () => {
    const category: Category = { id: 1, name: 'Work', color: '#ff0000' };
    const note: Note = {
      id: 1,
      text: 'Test note',
      categories: [category],
    };

    expect(note.categories).toHaveLength(1);
    expect(note.categories[0].name).toBe('Work');
  });

  it('should allow optional timestamp fields', () => {
    const note: Note = {
      id: 1,
      text: 'Test note',
      categories: [],
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-02T00:00:00Z',
    };

    expect(note.createdAt).toBe('2024-01-01T00:00:00Z');
    expect(note.updatedAt).toBe('2024-01-02T00:00:00Z');
  });
});
