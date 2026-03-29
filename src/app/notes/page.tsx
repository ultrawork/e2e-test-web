'use client';

import { useState, useEffect, useCallback } from 'react';
import NotesCounter from '@/components/NotesCounter';
import SearchBar from '@/components/SearchBar';
import { fetchNotes, type Note as ApiNote } from '@/lib/api';

interface Note {
  id: number;
  text: string;
}

export default function NotesPage(): React.ReactElement {
  const [notes, setNotes] = useState<Note[]>([]);
  const [input, setInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadNotes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const apiNotes: ApiNote[] = await fetchNotes();
      setNotes(apiNotes.map((n) => ({ id: n.id, text: n.title })));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load notes';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  useEffect(() => {
    const handler = () => {
      setError('Unauthorized. Please log in.');
    };
    window.addEventListener('auth:unauthorized', handler);
    return () => window.removeEventListener('auth:unauthorized', handler);
  }, []);

  const filteredNotes = notes.filter((n) =>
    n.text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  function addNote(): void {
    const text = input.trim();
    if (!text) return;
    setNotes((prev) => [...prev, { id: Date.now(), text }]);
    setInput('');
  }

  function deleteNote(id: number): void {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  }

  return (
    <main style={{ padding: '2rem', fontFamily: 'system-ui' }}>
      <h1>Notes</h1>

      {error && (
        <div data-testid="error-message" style={{ color: 'red', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {loading && !error && <p>Loading...</p>}

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
            <span>{note.text}</span>
            <button
              onClick={() => deleteNote(note.id)}
              aria-label={`Delete note: ${note.text}`}
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
