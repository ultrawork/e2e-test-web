'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import NotesCounter from '@/components/NotesCounter';
import SearchBar from '@/components/SearchBar';
import { getToken, getNotes as fetchNotes, createNote, deleteNote as apiDeleteNote, toggleFavorite } from '@/lib/api';
import type { Note } from '@/types';

export default function NotesPage(): React.ReactElement {
  const router = useRouter();
  const [notes, setNotes] = useState<Note[]>([]);
  const [input, setInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [operationError, setOperationError] = useState<string | null>(null);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);

  const loadNotes = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await fetchNotes();
      setNotes(data);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Ошибка загрузки заметок');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setIsAuthorized(false);
      setIsLoading(false);
      return;
    }
    setIsAuthorized(true);
    loadNotes();
  }, [loadNotes]);

  const filteredNotes = notes
    .filter((n) => !showFavoritesOnly || n.isFavorited)
    .filter((n) => n.title.toLowerCase().includes(searchQuery.toLowerCase()));

  async function addNote(): Promise<void> {
    const text = input.trim();
    if (!text) return;
    setOperationError(null);
    try {
      const newNote = await createNote({ title: text, content: text });
      setNotes((prev) => [...prev, newNote]);
      setInput('');
    } catch (err) {
      setOperationError(err instanceof Error ? err.message : 'Ошибка создания заметки');
    }
  }

  async function deleteNote(id: string): Promise<void> {
    setOperationError(null);
    try {
      await apiDeleteNote(id);
      setNotes((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      setOperationError(err instanceof Error ? err.message : 'Ошибка удаления заметки');
    }
  }

  async function handleToggleFavorite(id: string): Promise<void> {
    setOperationError(null);
    try {
      const updated = await toggleFavorite(id);
      setNotes((prev) => prev.map((n) => (n.id === id ? updated : n)));
    } catch (err) {
      setOperationError(err instanceof Error ? err.message : 'Ошибка обновления заметки');
    }
  }

  function handleLogout(): void {
    localStorage.removeItem('token');
    router.push('/login');
  }

  if (!isAuthorized) {
    return (
      <main style={{ padding: '2rem', fontFamily: 'system-ui' }}>
        <h1>Notes</h1>
        <p>Необходима авторизация</p>
        <Link href="/login">Войти</Link>
      </main>
    );
  }

  if (isLoading) {
    return (
      <main style={{ padding: '2rem', fontFamily: 'system-ui' }}>
        <h1>Notes</h1>
        <p>Loading…</p>
      </main>
    );
  }

  if (loadError) {
    return (
      <main style={{ padding: '2rem', fontFamily: 'system-ui' }}>
        <h1>Notes</h1>
        <p role="alert" style={{ color: 'red' }}>{loadError}</p>
      </main>
    );
  }

  return (
    <main style={{ padding: '2rem', fontFamily: 'system-ui' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Notes</h1>
        <button onClick={handleLogout} style={{ padding: '0.25rem 0.5rem' }}>
          Выйти
        </button>
      </div>

      {operationError && (
        <p role="alert" style={{ color: 'red', marginBottom: '0.5rem' }}>{operationError}</p>
      )}

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

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <button
          onClick={() => setShowFavoritesOnly((prev) => !prev)}
          aria-pressed={showFavoritesOnly}
          style={{ padding: '0.25rem 0.5rem' }}
        >
          Только избранные
        </button>
      </div>

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
            <div style={{ display: 'flex', gap: '0.25rem' }}>
              <button
                onClick={() => handleToggleFavorite(note.id)}
                aria-label="Toggle favorite"
                data-testid={`favorite-button-${note.id}`}
                style={{ padding: '0.25rem 0.5rem', cursor: 'pointer' }}
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
