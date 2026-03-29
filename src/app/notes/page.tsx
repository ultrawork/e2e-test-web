'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import NotesCounter from '@/components/NotesCounter';
import SearchBar from '@/components/SearchBar';

interface Note {
  id: number;
  title: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';

export default function NotesPage(): React.ReactElement {
  const router = useRouter();
  const [notes, setNotes] = useState<Note[]>([]);
  const [input, setInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    setAuthenticated(true);

    fetch(`${API_BASE}/notes`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (res.status === 401) {
          localStorage.removeItem('token');
          router.push('/login');
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data) setNotes(data);
      });
  }, [router]);

  const filteredNotes = notes.filter((n) =>
    n.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  async function addNote(): Promise<void> {
    const title = input.trim();
    if (!title) return;
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE}/notes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ title }),
    });
    if (res.status === 401) {
      localStorage.removeItem('token');
      router.push('/login');
      return;
    }
    const created = await res.json();
    setNotes((prev) => [...prev, created]);
    setInput('');
  }

  async function deleteNote(id: number): Promise<void> {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE}/notes/${id}`, {
      method: 'DELETE',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (res.status === 401) {
      localStorage.removeItem('token');
      router.push('/login');
      return;
    }
    setNotes((prev) => prev.filter((n) => n.id !== id));
  }

  if (!authenticated) {
    return <></>;
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
            <span>{note.title}</span>
            <button
              onClick={() => deleteNote(note.id)}
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
