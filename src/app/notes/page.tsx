'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import NotesCounter from '@/components/NotesCounter';
import SearchBar from '@/components/SearchBar';
import type { Note } from '@/api/types';
import { fetchNotes, createNote, deleteNote } from '@/api/api';

export default function NotesPage(): React.ReactElement {
  const router = useRouter();
  const [notes, setNotes] = useState<Note[]>([]);
  const [input, setInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    setAuthenticated(true);

    fetchNotes()
      .then((result) => {
        if (result.ok) {
          setNotes(result.data);
        } else if (result.error.status === 401) {
          localStorage.removeItem('token');
          router.push('/login');
          return;
        } else {
          setError(result.error.message);
        }
      })
      .catch(() => {
        setError('Network error');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [router]);

  const filteredNotes = notes.filter((n) =>
    n.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  async function handleAddNote(): Promise<void> {
    const title = input.trim();
    if (!title) return;

    try {
      const result = await createNote(title);
      if (result.ok) {
        setNotes((prev) => [...prev, result.data]);
        setInput('');
      } else if (result.error.status === 401) {
        localStorage.removeItem('token');
        router.push('/login');
      } else {
        setError(result.error.message);
      }
    } catch {
      setError('Network error');
    }
  }

  async function handleDeleteNote(id: number): Promise<void> {
    try {
      const result = await deleteNote(id);
      if (result.ok) {
        setNotes((prev) => prev.filter((n) => n.id !== id));
      } else if (result.error.status === 401) {
        localStorage.removeItem('token');
        router.push('/login');
      } else {
        setError(result.error.message);
      }
    } catch {
      setError('Network error');
    }
  }

  if (!authenticated) {
    return <></>;
  }

  return (
    <main style={{ padding: '2rem', fontFamily: 'system-ui' }}>
      <h1>Notes</h1>

      {error && (
        <div role="alert" style={{ color: 'red', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAddNote();
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

          {notes.length === 0 ? (
            <p>No notes yet</p>
          ) : (
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
        </>
      )}
    </main>
  );
}
