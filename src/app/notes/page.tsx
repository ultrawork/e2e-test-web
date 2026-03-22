'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Note, Category } from '@/types';
import {
  fetchNotes,
  fetchCategories,
  createNote,
  updateNote,
  deleteNote,
} from '@/lib/api';
import NotesCounter from '@/components/NotesCounter';
import SearchBar from '@/components/SearchBar';
import CategoryBadge from '@/components/CategoryBadge';
import CategoryFilter from '@/components/CategoryFilter';
import CategoryManager from '@/components/CategoryManager';

export default function NotesPage(): React.ReactElement {
  const [notes, setNotes] = useState<Note[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [showCategoryManager, setShowCategoryManager] = useState(false);

  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formCategoryIds, setFormCategoryIds] = useState<string[]>([]);

  const loadCategories = useCallback(async () => {
    try {
      const cats = await fetchCategories();
      setCategories(cats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки категорий');
    }
  }, []);

  const loadNotes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchNotes(selectedCategoryId ?? undefined);
      setNotes(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки заметок');
    } finally {
      setLoading(false);
    }
  }, [selectedCategoryId]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const filteredNotes = notes.filter((n) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q);
  });

  async function handleCreateNote(): Promise<void> {
    const title = formTitle.trim();
    const content = formContent.trim();
    if (!title) return;
    try {
      await createNote({ title, content, categoryIds: formCategoryIds.length > 0 ? formCategoryIds : undefined });
      setFormTitle('');
      setFormContent('');
      setFormCategoryIds([]);
      await loadNotes();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка создания заметки');
    }
  }

  async function handleUpdateNote(): Promise<void> {
    if (!editingNote) return;
    const title = formTitle.trim();
    const content = formContent.trim();
    if (!title) return;
    try {
      await updateNote(editingNote.id, { title, content, categoryIds: formCategoryIds.length > 0 ? formCategoryIds : undefined });
      setEditingNote(null);
      setFormTitle('');
      setFormContent('');
      setFormCategoryIds([]);
      await loadNotes();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка обновления заметки');
    }
  }

  async function handleDeleteNote(id: string): Promise<void> {
    try {
      await deleteNote(id);
      await loadNotes();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка удаления заметки');
    }
  }

  function handleEditNote(note: Note): void {
    setEditingNote(note);
    setFormTitle(note.title);
    setFormContent(note.content);
    setFormCategoryIds(note.categories.map((c) => c.id));
  }

  function handleCancelEdit(): void {
    setEditingNote(null);
    setFormTitle('');
    setFormContent('');
    setFormCategoryIds([]);
  }

  function toggleCategoryId(id: string): void {
    setFormCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((cid) => cid !== id) : [...prev, id],
    );
  }

  return (
    <main style={{ padding: '2rem', fontFamily: 'system-ui' }}>
      <h1>Notes</h1>

      {error && (
        <p style={{ color: 'red', marginBottom: '1rem' }}>{error}</p>
      )}

      <div style={{ marginBottom: '1rem' }}>
        <button
          type="button"
          onClick={() => setShowCategoryManager(!showCategoryManager)}
          style={{ padding: '0.35rem 0.75rem', cursor: 'pointer', marginBottom: '0.5rem' }}
        >
          {showCategoryManager ? 'Скрыть категории' : 'Управление категориями'}
        </button>
        {showCategoryManager && (
          <CategoryManager categories={categories} onRefresh={loadCategories} />
        )}
      </div>

      <CategoryFilter
        categories={categories}
        selectedId={selectedCategoryId}
        onChange={setSelectedCategoryId}
      />

      <SearchBar value={searchQuery} onChange={setSearchQuery} />

      <NotesCounter
        totalCount={notes.length}
        filteredCount={searchQuery ? filteredNotes.length : undefined}
      />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (editingNote) {
            handleUpdateNote();
          } else {
            handleCreateNote();
          }
        }}
        style={{ marginBottom: '1.5rem', padding: '1rem', border: '1px solid #ddd', borderRadius: '8px' }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label htmlFor="note-title" style={{ fontWeight: 600, fontSize: '0.9rem' }}>Заголовок</label>
          <input
            id="note-title"
            type="text"
            value={formTitle}
            onChange={(e) => setFormTitle(e.target.value)}
            placeholder="Введите заголовок"
            style={{ padding: '0.5rem' }}
          />

          <label htmlFor="note-content" style={{ fontWeight: 600, fontSize: '0.9rem' }}>Содержимое</label>
          <textarea
            id="note-content"
            value={formContent}
            onChange={(e) => setFormContent(e.target.value)}
            placeholder="Введите текст заметки"
            rows={3}
            style={{ padding: '0.5rem', resize: 'vertical' }}
          />

          {categories.length > 0 && (
            <div>
              <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Категории</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.25rem' }}>
                {categories.map((cat) => (
                  <label key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formCategoryIds.includes(cat.id)}
                      onChange={() => toggleCategoryId(cat.id)}
                    />
                    <CategoryBadge category={cat} />
                  </label>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
            <button type="submit" style={{ padding: '0.5rem 1rem' }}>
              {editingNote ? 'Update' : 'Add'}
            </button>
            {editingNote && (
              <button type="button" onClick={handleCancelEdit} style={{ padding: '0.5rem 1rem' }}>
                Cancel
              </button>
            )}
          </div>
        </div>
      </form>

      {loading && <p>Загрузка...</p>}

      <ul style={{ listStyle: 'none', padding: 0 }}>
        {filteredNotes.map((note) => (
          <li
            key={note.id}
            style={{
              padding: '0.75rem 0',
              borderBottom: '1px solid #eee',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <strong>{note.title}</strong>
                {note.categories.length > 0 && (
                  <span style={{ marginLeft: '0.5rem' }}>
                    {note.categories.map((cat) => (
                      <CategoryBadge key={cat.id} category={cat} />
                    ))}
                  </span>
                )}
                <p style={{ margin: '0.25rem 0 0', color: '#555' }}>{note.content}</p>
              </div>
              <div style={{ display: 'flex', gap: '0.25rem', flexShrink: 0 }}>
                <button
                  onClick={() => handleEditNote(note)}
                  style={{ padding: '0.25rem 0.5rem', cursor: 'pointer' }}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteNote(note.id)}
                  aria-label={`Delete note: ${note.title}`}
                  style={{ padding: '0.25rem 0.5rem', cursor: 'pointer' }}
                >
                  Delete
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
