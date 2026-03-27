'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import NotesCounter from '@/components/NotesCounter';
import SearchBar from '@/components/SearchBar';
import { getToken, clearToken, getNotes, createNote, deleteNote } from '@/lib/api';
import { Note } from '@/types';

export default function NotesPage(): React.ReactElement {
  const router = useRouter();
  const [notes, setNotes] = useState<Note[]>([]);
  const [input, setInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [error, setError] = useState('');

  const loadNotes = useCallback(async () => {
    try {
      const data = await getNotes();
      setNotes(data);
      setError('');
    } catch (err) {
      // 401 already handled in apiRequest (redirect)
      if (err instanceof Error && err.message !== 'Unauthorized') {
        setError('Ошибка при загрузке заметок');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setAuthorized(false);
      setLoading(false);
      return;
    }
    setAuthorized(true);
    loadNotes();
  }, [loadNotes]);

  const filteredNotes = notes.filter((n) =>
    n.text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  async function handleAddNote(): Promise<void> {
    const text = input.trim();
    if (!text) return;
    try {
      const note = await createNote(text);
      setNotes((prev) => [...prev, note]);
      setInput('');
      setError('');
    } catch (err) {
      // 401 already handled in apiRequest (redirect)
      if (err instanceof Error && err.message !== 'Unauthorized') {
        setError('Ошибка при добавлении заметки');
      }
    }
  }

  async function handleDeleteNote(id: string): Promise<void> {
    try {
      await deleteNote(id);
      setNotes((prev) => prev.filter((n) => n.id !== id));
      setError('');
    } catch (err) {
      // 401 already handled in apiRequest (redirect)
      if (err instanceof Error && err.message !== 'Unauthorized') {
        setError('Ошибка при удалении заметки');
      }
    }
  }

  function handleLogout(): void {
    clearToken();
    router.push('/login');
  }

  if (loading) {
    return (
      <main style={{ padding: '2rem', fontFamily: 'system-ui' }}>
        <p>Загрузка...</p>
      </main>
    );
  }

  if (!authorized) {
    return (
      <main style={{ padding: '2rem', fontFamily: 'system-ui' }}>
        <p>Необходима авторизация</p>
        <Link href="/login">Войти</Link>
      </main>
    );
  }

  return (
    <main style={{ padding: '2rem', fontFamily: 'system-ui' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1>Notes</h1>
        <button onClick={handleLogout} style={{ padding: '0.5rem 1rem' }}>
          Выйти
        </button>
      </div>

      {error && (
        <p role="alert" style={{ color: 'red', marginBottom: '1rem' }}>
          {error}
        </p>
      )}

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
              onClick={() => handleDeleteNote(note.id)}
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
