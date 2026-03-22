'use client';

import { useState, useEffect } from 'react';
import NotesCounter from '@/components/NotesCounter';
import SearchBar from '@/components/SearchBar';
import { Note } from '@/types';
import {
  getNotes,
  createNote,
  deleteNote as apiDeleteNote,
  toggleFavorite as apiToggleFavorite,
} from '@/lib/api';

export default function NotesPage(): React.ReactElement {
  const [notes, setNotes] = useState<Note[]>([]);
  const [input, setInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getNotes()
      .then((data) => setNotes(data))
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, []);

  const filteredNotes = notes.filter((n) =>
    n.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  async function addNote(): Promise<void> {
    const text = input.trim();
    if (!text) return;
    try {
      const newNote = await createNote({ title: text, content: text });
      setNotes((prev) => [...prev, newNote]);
      setInput('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create note');
    }
  }

  async function deleteNote(id: string): Promise<void> {
    try {
      await apiDeleteNote(id);
      setNotes((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete note');
    }
  }

  async function toggleFavorite(id: string): Promise<void> {
    try {
      const updated = await apiToggleFavorite(id);
      setNotes((prev) => prev.map((n) => (n.id === id ? updated : n)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle favorite');
    }
  }

  if (isLoading) {
    return (
      <main style={{ padding: '2rem', fontFamily: 'system-ui' }}>
        <p data-testid="loading">Loading...</p>
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
            <div style={{ display: 'flex', gap: '0.25rem' }}>
              <button
                onClick={() => toggleFavorite(note.id)}
                data-testid={`favorite-button-${note.id}`}
                aria-label={`Toggle favorite: ${note.title}`}
                style={{ padding: '0.25rem 0.5rem' }}
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
