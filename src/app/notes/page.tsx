'use client';

import { useState, useEffect, useCallback } from 'react';
import NotesCounter from '@/components/NotesCounter';
import SearchBar from '@/components/SearchBar';
import { getToken, getNotes as fetchNotes, createNote, deleteNote as apiDeleteNote } from '@/lib/api';
import type { Note } from '@/types';

export default function NotesPage(): React.ReactElement | null {
  const [notes, setNotes] = useState<Note[]>([]);
  const [input, setInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  const loadNotes = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchNotes();
      setNotes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки заметок');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setError('Необходима авторизация');
      setAuthChecked(true);
      return;
    }
    loadNotes().finally(() => setAuthChecked(true));
  }, [loadNotes]);

  const filteredNotes = notes.filter((n) =>
    n.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  async function addNote(): Promise<void> {
    const text = input.trim();
    if (!text) return;
    try {
      const newNote = await createNote(text);
      setNotes((prev) => [...prev, newNote]);
      setInput('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка создания заметки');
    }
  }

  async function handleDeleteNote(id: string): Promise<void> {
    try {
      await apiDeleteNote(id);
      setNotes((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка удаления заметки');
    }
  }

  if (!authChecked) {
    return null;
  }

  if (error === 'Необходима авторизация') {
    return (
      <main style={{ padding: '2rem', fontFamily: 'system-ui' }}>
        <h1>Notes</h1>
        <p role="alert">{error}</p>
      </main>
    );
  }

  return (
    <main style={{ padding: '2rem', fontFamily: 'system-ui' }}>
      <h1>Notes</h1>

      {error && (
        <p role="alert" style={{ color: 'red', marginBottom: '1rem' }}>
          {error}
        </p>
      )}

      {loading && <p>Загрузка...</p>}

      <form
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

      <ul style={{ listStyle: 'none', padding: 0 }}>
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
            <button
              onClick={() => handleDeleteNote(note.id)}
              aria-label={`Delete note: ${note.title}`}
              style={{ padding: '0.25rem 0.5rem' }}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}
