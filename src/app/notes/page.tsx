'use client';

import { useState, useEffect, useCallback } from 'react';
import NotesCounter from '@/components/NotesCounter';
import SearchBar from '@/components/SearchBar';
import { api } from '@/lib/api';
import { Note } from '@/types';

export default function NotesPage(): React.ReactElement {
  const [notes, setNotes] = useState<Note[]>([]);
  const [input, setInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadNotes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getNotes();
      setNotes(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Необходима авторизация');
      return;
    }
    loadNotes();
  }, [loadNotes]);

  const filteredNotes = notes.filter((n) =>
    n.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  async function addNote(): Promise<void> {
    const title = input.trim();
    if (!title) return;
    try {
      const note = await api.createNote({ title, content: '' });
      setNotes((prev) => [...prev, note]);
      setInput('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка создания');
    }
  }

  async function deleteNote(id: string): Promise<void> {
    try {
      await api.deleteNote(id);
      setNotes((prev) => prev.filter((n) => n.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка удаления');
    }
  }

  /** Toggle isFavorited via PATCH /api/notes/:id/favorite */
  async function handleToggleFavorite(id: string): Promise<void> {
    try {
      const updated = await api.toggleFavorite(id);
      setNotes((prev) => prev.map((n) => (n.id === id ? updated : n)));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка обновления');
    }
  }

  /* auth guard – SC-010 */
  if (error === 'Необходима авторизация') {
    return (
      <main data-testid="auth-guard" style={{ padding: '2rem', fontFamily: 'system-ui' }}>
        <h1>Notes</h1>
        <p role="alert">Необходима авторизация</p>
      </main>
    );
  }

  if (loading) {
    return (
      <main style={{ padding: '2rem', fontFamily: 'system-ui' }}>
        <h1>Notes</h1>
        <p>Загрузка...</p>
      </main>
    );
  }

  return (
    <main style={{ padding: '2rem', fontFamily: 'system-ui' }}>
      <h1>Notes</h1>

      {error && <p role="alert">{error}</p>}

      <form
        data-testid="add-note-form"
        onSubmit={(e) => {
          e.preventDefault();
          addNote();
        }}
        style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}
      >
        <label htmlFor="new-note" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)' }}>
          New note
        </label>
        <input
          id="new-note"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter a note"
          style={{ flex: 1, padding: '0.5rem' }}
        />
        <button type="submit" style={{ padding: '0.5rem 1rem' }}>
          Add
        </button>
      </form>

      <SearchBar value={searchQuery} onChange={setSearchQuery} />

      <NotesCounter totalCount={notes.length} filteredCount={searchQuery ? filteredNotes.length : undefined} />

      <ul data-testid="notes-list" style={{ listStyle: 'none', padding: 0 }}>
        {filteredNotes.map((note) => (
          <li
            key={note.id}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.5rem 0',
              borderBottom: '1px solid #eee',
            }}
          >
            <span>{note.title}</span>
            <div style={{ display: 'flex', gap: '0.25rem' }}>
              <button
                onClick={() => handleToggleFavorite(note.id)}
                aria-label={note.isFavorited ? `Убрать из избранного: ${note.title}` : `Добавить в избранное: ${note.title}`}
                style={{ padding: '0.25rem 0.5rem', cursor: 'pointer', background: 'none', border: 'none', fontSize: '1.2rem' }}
              >
                {note.isFavorited ? '★' : '☆'}
              </button>
              <button
                onClick={() => deleteNote(note.id)}
                aria-label={`Delete note: ${note.title}`}
                style={{ padding: '0.25rem 0.5rem' }}
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
