'use client';

import { useEffect, useState } from 'react';
import NotesCounter from '@/components/NotesCounter';
import SearchBar from '@/components/SearchBar';
import { Note } from '@/types';
import { createNote, deleteNote, getNotes } from '@/lib/api';

export default function NotesPage(): React.ReactElement {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [operationError, setOperationError] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [input, setInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoadError('Токен не найден. Сохраните токен в localStorage под ключом "token".');
      setIsLoading(false);
      return;
    }
    getNotes()
      .then(setNotes)
      .catch((e: Error) => setLoadError(e.message))
      .finally(() => setIsLoading(false));
  }, []);

  const filteredNotes = notes
    .filter((n) => !showFavoritesOnly || favorites.has(n.id))
    .filter((n) => n.title.toLowerCase().includes(searchQuery.toLowerCase()));

  async function addNote(): Promise<void> {
    const title = input.trim();
    if (!title) return;
    setOperationError(null);
    try {
      const created = await createNote({ title, content: '' });
      setNotes((prev) => [...prev, created]);
      setInput('');
    } catch (e) {
      setOperationError((e as Error).message);
    }
  }

  async function handleDelete(id: string): Promise<void> {
    setOperationError(null);
    try {
      await deleteNote(id);
      setNotes((prev) => prev.filter((n) => n.id !== id));
    } catch (e) {
      setOperationError((e as Error).message);
    }
  }

  function toggleFavorite(id: string): void {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  return (
    <main style={{ padding: '2rem', fontFamily: 'system-ui' }}>
      <h1>Notes</h1>

      {isLoading && <p>Загрузка...</p>}

      {loadError && (
        <p role="alert" style={{ color: 'red' }}>
          {loadError}
        </p>
      )}

      {operationError && (
        <p role="alert" style={{ color: 'red' }}>
          {operationError}
        </p>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          addNote();
        }}
        style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}
      >
        <label
          htmlFor="new-note"
          style={{
            position: 'absolute',
            width: 1,
            height: 1,
            overflow: 'hidden',
            clip: 'rect(0,0,0,0)',
          }}
        >
          New note
        </label>
        <input
          id="new-note"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter a note"
          disabled={isLoading}
          style={{ flex: 1, padding: '0.5rem' }}
        />
        <button type="submit" disabled={isLoading} style={{ padding: '0.5rem 1rem' }}>
          Add
        </button>
      </form>

      <SearchBar value={searchQuery} onChange={setSearchQuery} />

      <NotesCounter
        totalCount={notes.length}
        filteredCount={searchQuery ? filteredNotes.length : undefined}
      />

      <button
        onClick={() => setShowFavoritesOnly((prev) => !prev)}
        style={{ marginBottom: '1rem', padding: '0.25rem 0.75rem' }}
      >
        {showFavoritesOnly ? '★ Только избранные' : '☆ Только избранные'}
      </button>

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
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => toggleFavorite(note.id)}
                aria-label={`Toggle favorite: ${note.title}`}
                data-testid={`favorite-button-${note.id}`}
                style={{ padding: '0.25rem 0.5rem' }}
              >
                {favorites.has(note.id) ? '★' : '☆'}
              </button>
              <button
                onClick={() => handleDelete(note.id)}
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
