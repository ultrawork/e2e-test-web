'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import NotesCounter from '@/components/NotesCounter';
import SearchBar from '@/components/SearchBar';
import { getNotes, createNote, deleteNote, getToken, clearToken } from '@/lib/api';
import type { Note } from '@/types';

export default function NotesPage(): React.ReactElement {
  const router = useRouter();
  const [notes, setNotes] = useState<Note[]>([]);
  const [input, setInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const token = typeof window !== 'undefined' ? getToken() : null;

  const loadNotes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getNotes();
      setNotes(data);
    } catch {
      setError('Ошибка загрузки заметок');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    loadNotes();
  }, [token, loadNotes]);

  const filteredNotes = notes.filter((n) =>
    n.text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  async function addNote(): Promise<void> {
    const text = input.trim();
    if (!text) return;
    try {
      const note = await createNote(text);
      setNotes((prev) => [...prev, note]);
      setInput('');
    } catch {
      setError('Ошибка создания заметки');
    }
  }

  async function handleDelete(id: string): Promise<void> {
    try {
      await deleteNote(id);
      setNotes((prev) => prev.filter((n) => n.id !== id));
    } catch {
      setError('Ошибка удаления заметки');
    }
  }

  function handleLogout(): void {
    clearToken();
    router.push('/login');
  }

  if (!token) {
    return (
      <main style={{ padding: '2rem', fontFamily: 'system-ui' }}>
        <h1>Notes</h1>
        <p>Необходима авторизация</p>
        <Link href="/login">Войти</Link>
      </main>
    );
  }

  if (loading) {
    return (
      <main style={{ padding: '2rem', fontFamily: 'system-ui' }}>
        <h1>Notes</h1>
        <p>Загрузка...</p>
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

      {error && (
        <p role="alert" style={{ color: 'red' }}>
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
            <span>{note.text}</span>
            <button
              onClick={() => handleDelete(note.id)}
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
