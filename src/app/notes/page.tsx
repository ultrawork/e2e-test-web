'use client';

import { useState, useEffect } from 'react';
import NotesCounter from '@/components/NotesCounter';
import SearchBar from '@/components/SearchBar';
import type { Note } from '@/types';
import { getNotes, createNote as apiCreateNote, deleteNote as apiDeleteNote } from '@/lib/api';

export default function NotesPage(): React.ReactElement {
  const [notes, setNotes] = useState<Note[]>([]);
  const [titleInput, setTitleInput] = useState('');
  const [contentInput, setContentInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [operationError, setOperationError] = useState<string | null>(null);
  const [favoritedIds, setFavoritedIds] = useState<Set<string>>(new Set());
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    getNotes()
      .then(setNotes)
      .catch((err: unknown) => setLoadError(err instanceof Error ? err.message : 'Failed to load notes'))
      .finally(() => setIsLoading(false));
  }, []);

  function isFavorited(id: string): boolean {
    return favoritedIds.has(id);
  }

  function toggleFavorite(id: string): void {
    setFavoritedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  async function addNote(): Promise<void> {
    const title = titleInput.trim();
    const content = contentInput.trim();
    if (!title || !content) return;

    setOperationError(null);
    try {
      const created = await apiCreateNote({ title, content });
      setNotes((prev) => [...prev, created]);
      setTitleInput('');
      setContentInput('');
    } catch (err: unknown) {
      setOperationError(err instanceof Error ? err.message : 'Failed to create note');
    }
  }

  async function handleDeleteNote(id: string): Promise<void> {
    setOperationError(null);
    try {
      await apiDeleteNote(id);
      setNotes((prev) => prev.filter((n) => n.id !== id));
    } catch (err: unknown) {
      setOperationError(err instanceof Error ? err.message : 'Failed to delete note');
    }
  }

  const filteredNotes = notes
    .filter((n) => !showFavoritesOnly || isFavorited(n.id))
    .filter((n) => n.title.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <main style={{ padding: '2rem', fontFamily: 'system-ui' }}>
      <h1>Notes</h1>

      {isLoading && <p>Loading...</p>}
      {loadError && <p role="alert" style={{ color: 'red' }}>{loadError}</p>}
      {operationError && <p role="alert" style={{ color: 'red' }}>{operationError}</p>}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          addNote();
        }}
        style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}
      >
        <label htmlFor="note-title" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)' }}>
          Note title
        </label>
        <input
          id="note-title"
          type="text"
          value={titleInput}
          onChange={(e) => setTitleInput(e.target.value)}
          placeholder="Title"
          style={{ padding: '0.5rem' }}
        />
        <label htmlFor="note-content" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)' }}>
          Note content
        </label>
        <textarea
          id="note-content"
          value={contentInput}
          onChange={(e) => setContentInput(e.target.value)}
          placeholder="Content"
          style={{ padding: '0.5rem' }}
        />
        <button type="submit" style={{ padding: '0.5rem 1rem', alignSelf: 'flex-start' }}>
          Add
        </button>
      </form>

      <SearchBar value={searchQuery} onChange={setSearchQuery} />

      <div style={{ marginBottom: '1rem' }}>
        <label>
          <input
            type="checkbox"
            checked={showFavoritesOnly}
            onChange={(e) => setShowFavoritesOnly(e.target.checked)}
          />{' '}
          Show favorites only
        </label>
      </div>

      <NotesCounter totalCount={notes.length} filteredCount={searchQuery || showFavoritesOnly ? filteredNotes.length : undefined} />

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
            <div>
              <strong>{note.title}</strong>
              <p style={{ margin: '0.25rem 0 0', color: '#555' }}>{note.content}</p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => toggleFavorite(note.id)}
                aria-label={isFavorited(note.id) ? `Unfavorite note: ${note.title}` : `Favorite note: ${note.title}`}
                style={{ padding: '0.25rem 0.5rem' }}
              >
                {isFavorited(note.id) ? '\u2605' : '\u2606'}
              </button>
              <button
                onClick={() => handleDeleteNote(note.id)}
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
