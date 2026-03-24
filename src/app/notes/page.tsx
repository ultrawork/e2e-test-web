'use client';

import { useState, useEffect } from 'react';
import NotesCounter from '@/components/NotesCounter';
import SearchBar from '@/components/SearchBar';
import type { Note } from '@/types';
import { getNotes, createNote, deleteNote, toggleFavorite } from '@/lib/api';

export default function NotesPage(): React.ReactElement {
  const [notes, setNotes] = useState<Note[]>([]);
  const [titleInput, setTitleInput] = useState('');
  const [contentInput, setContentInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [operationError, setOperationError] = useState<string | null>(null);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    getNotes()
      .then(setNotes)
      .catch((e: Error) => setLoadError(e.message))
      .finally(() => setIsLoading(false));
  }, []);

  const filteredNotes = notes
    .filter((n) => !showFavoritesOnly || n.isFavorited)
    .filter((n) =>
      n.title.toLowerCase().includes(searchQuery.toLowerCase()),
    );

  async function handleAddNote(): Promise<void> {
    const title = titleInput.trim();
    const content = contentInput.trim();
    if (!title) return;
    setOperationError(null);
    try {
      const note = await createNote({ title, content });
      setNotes((prev) => [...prev, note]);
      setTitleInput('');
      setContentInput('');
    } catch (e: unknown) {
      setOperationError((e as Error).message);
    }
  }

  async function handleDeleteNote(id: string): Promise<void> {
    setOperationError(null);
    try {
      await deleteNote(id);
      setNotes((prev) => prev.filter((n) => n.id !== id));
    } catch (e: unknown) {
      setOperationError((e as Error).message);
    }
  }

  function handleToggleFavorite(id: string): void {
    setNotes((prev) => toggleFavorite(prev, id));
  }

  return (
    <main style={{ padding: '2rem', fontFamily: 'system-ui' }}>
      <h1>Notes</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleAddNote();
        }}
        style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}
      >
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <label htmlFor="note-title" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)' }}>
            Title
          </label>
          <input
            id="note-title"
            type="text"
            value={titleInput}
            onChange={(e) => setTitleInput(e.target.value)}
            placeholder="Enter a note"
            style={{ flex: 1, padding: '0.5rem' }}
          />
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <label htmlFor="note-content" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)' }}>
            Content
          </label>
          <textarea
            id="note-content"
            value={contentInput}
            onChange={(e) => setContentInput(e.target.value)}
            placeholder="Note content"
            style={{ flex: 1, padding: '0.5rem' }}
          />
        </div>
        <button type="submit" style={{ padding: '0.5rem 1rem', alignSelf: 'flex-start' }}>
          Add
        </button>
      </form>

      {operationError && (
        <p role="alert" style={{ color: 'red', marginBottom: '0.5rem' }}>
          {operationError}
        </p>
      )}

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <button
          onClick={() => setShowFavoritesOnly((prev) => !prev)}
          style={{ padding: '0.25rem 0.5rem' }}
        >
          {showFavoritesOnly ? 'All' : '★ Only'}
        </button>
      </div>

      <SearchBar value={searchQuery} onChange={setSearchQuery} />

      <NotesCounter
        totalCount={notes.length}
        filteredCount={searchQuery || showFavoritesOnly ? filteredNotes.length : undefined}
      />

      {isLoading && <p>Loading...</p>}

      {loadError && (
        <p role="alert" style={{ color: 'red' }}>
          {loadError}
        </p>
      )}

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
                data-testid={`favorite-button-${note.id}`}
                aria-label="Toggle favorite"
                onClick={() => handleToggleFavorite(note.id)}
                style={{ padding: '0.25rem 0.5rem', cursor: 'pointer' }}
              >
                {note.isFavorited ? '★' : '☆'}
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
