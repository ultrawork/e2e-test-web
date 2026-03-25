'use client';

import { useState, useEffect, useCallback } from 'react';
import NotesCounter from '@/components/NotesCounter';
import SearchBar from '@/components/SearchBar';
import type { Note } from '@/types/note';
import { fetchNotes, createNote, deleteNote, getDevToken, ApiError } from '@/lib/api';

export default function NotesPage(): React.ReactElement {
  const [notes, setNotes] = useState<Note[]>([]);
  const [input, setInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredNotes = notes.filter((n) =>
    n.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  function getErrorMessage(err: unknown): string {
    if (err instanceof ApiError) {
      if (err.status === 401 || err.status === 403) {
        localStorage.removeItem('token');
        return 'Ошибка авторизации. Попробуйте ещё раз.';
      }
      return `Ошибка сервера: ${err.message}`;
    }
    return 'Ошибка сети. Проверьте соединение.';
  }

  const loadNotes = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchNotes();
      setNotes(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    async function init(): Promise<void> {
      if (process.env.NODE_ENV === 'development' && !localStorage.getItem('token')) {
        try {
          await getDevToken();
        } catch {
          // proceed without token — loadNotes will handle auth error
        }
      }
      await loadNotes();
    }
    init();
  }, [loadNotes]);

  async function addNote(): Promise<void> {
    const title = input.trim();
    if (!title) return;
    try {
      const note = await createNote({ title, content: '' });
      setNotes((prev) => [...prev, note]);
      setInput('');
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function handleDeleteNote(id: string): Promise<void> {
    try {
      await deleteNote(id);
      setNotes((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  return (
    <main style={{ padding: '2rem', fontFamily: 'system-ui' }}>
      <h1>Notes</h1>

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

      {loading && <p>Загрузка...</p>}

      {error && (
        <div>
          <p role="alert">{error}</p>
          <button onClick={loadNotes}>Повторить</button>
        </div>
      )}

      {!loading && (
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
      )}
    </main>
  );
}
