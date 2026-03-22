'use client';

import { useState } from 'react';
import type { Category } from '@/types';
import {
  createCategory,
  updateCategory,
  deleteCategory,
} from '@/lib/api';
import CategoryBadge from './CategoryBadge';

const HEX_REGEX = /^#[0-9A-Fa-f]{6}$/;

interface CategoryManagerProps {
  categories: Category[];
  onRefresh: () => void;
}

export default function CategoryManager({ categories, onRefresh }: CategoryManagerProps): React.ReactElement {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#3b82f6');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  function validate(): boolean {
    if (!name.trim() || name.trim().length > 30) {
      setError('Название: от 1 до 30 символов');
      return false;
    }
    if (!HEX_REGEX.test(color)) {
      setError('Цвет должен быть в формате #RRGGBB');
      return false;
    }
    setError(null);
    return true;
  }

  async function handleSubmit(): Promise<void> {
    if (!validate()) return;
    try {
      if (editingId) {
        await updateCategory(editingId, { name: name.trim(), color });
      } else {
        await createCategory({ name: name.trim(), color });
      }
      setName('');
      setColor('#3b82f6');
      setEditingId(null);
      setIsAdding(false);
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при сохранении');
    }
  }

  async function handleDelete(id: string): Promise<void> {
    try {
      await deleteCategory(id);
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при удалении');
    }
  }

  function handleEdit(cat: Category): void {
    setEditingId(cat.id);
    setName(cat.name);
    setColor(cat.color);
    setIsAdding(true);
    setError(null);
  }

  function handleCancel(): void {
    setEditingId(null);
    setName('');
    setColor('#3b82f6');
    setIsAdding(false);
    setError(null);
  }

  return (
    <div data-testid="category-manager" style={{ marginBottom: '1.5rem', padding: '1rem', border: '1px solid #ddd', borderRadius: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Категории</h2>
        {!isAdding && (
          <button type="button" onClick={() => setIsAdding(true)} style={{ padding: '0.25rem 0.75rem', cursor: 'pointer' }}>
            Добавить
          </button>
        )}
      </div>

      {error && (
        <p style={{ color: 'red', fontSize: '0.85rem', margin: '0 0 0.5rem' }}>{error}</p>
      )}

      {isAdding && (
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Название"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ padding: '0.35rem', flex: 1, minWidth: '120px' }}
            data-testid="category-name-input"
          />
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            style={{ width: '40px', height: '32px', padding: 0, border: 'none', cursor: 'pointer' }}
            data-testid="category-color-picker"
          />
          <input
            type="text"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            placeholder="#RRGGBB"
            style={{ padding: '0.35rem', width: '90px', fontFamily: 'monospace' }}
            data-testid="category-color-input"
          />
          <button type="button" onClick={handleSubmit} style={{ padding: '0.35rem 0.75rem', cursor: 'pointer' }}>
            {editingId ? 'Сохранить' : 'Создать'}
          </button>
          <button type="button" onClick={handleCancel} style={{ padding: '0.35rem 0.75rem', cursor: 'pointer' }}>
            Отмена
          </button>
        </div>
      )}

      {categories.length === 0 && <p style={{ color: '#888', fontSize: '0.85rem' }}>Нет категорий</p>}

      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {categories.map((cat) => (
          <li key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.3rem 0' }}>
            <CategoryBadge category={cat} />
            <span style={{ flex: 1 }} />
            <button
              type="button"
              onClick={() => handleEdit(cat)}
              style={{ padding: '0.15rem 0.5rem', fontSize: '0.8rem', cursor: 'pointer' }}
            >
              Изменить
            </button>
            <button
              type="button"
              onClick={() => handleDelete(cat.id)}
              style={{ padding: '0.15rem 0.5rem', fontSize: '0.8rem', cursor: 'pointer', color: 'red' }}
            >
              Удалить
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
