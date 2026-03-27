'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import NotesCounter from '@/components/NotesCounter';
import SearchBar from '@/components/SearchBar';
import { getToken, fetchNotes as apiFetchNotes } from '@/lib/api';

interface Note {
  id: number;
  text: string;
}

export default function NotesPage(): React.ReactElement {
  const [notes, setNotes] = useState<Note[]>([]);
  const [input, setInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (token) {
      setIsAuthenticated(true);
      apiFetchNotes()
        .then((data) => setNotes(data))
        .catch(() => {
          /* API not available — start with empty state */
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsAuthenticated(false);
      setIsLoading(false);
    }

    const handleUnauthorized = () => {
      setIsAuthenticated(false);
      setIsLoading(false);
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
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

  if (isLoading) {
    return <div />;
  }

  if (!isAuthenticated) {
    return (
      <main style={{ padding: '2rem', fontFamily: 'system-ui' }}>
        <h1>Notes</h1>
        <p>Необходима авторизация</p>
        <Link href="/">Войти</Link>
      </main>
    );
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
