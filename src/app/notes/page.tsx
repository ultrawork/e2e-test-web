'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Note } from '@/types';
import { getNotes, createNote, deleteNote, toggleFavorite, clearToken } from '@/lib/api';
import NotesCounter from '@/components/NotesCounter';
import SearchBar from '@/components/SearchBar';

export default function NotesPage(): React.ReactElement {
  const router = useRouter();
  const [notes, setNotes] = useState<Note[]>([]);
  const [titleInput, setTitleInput] = useState('');
  const [contentInput, setContentInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [hasToken, setHasToken] = useState(false);

  const loadNotes = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getNotes();
      setNotes(data);
    } catch {
      setError('Ошибка загрузки заметок. Попробуйте позже.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setHasToken(false);
      setIsLoading(false);
      return;
    }
    setHasToken(true);
    loadNotes();
  }, [loadNotes]);

  if (!hasToken) {
    return (
      <main style={{ padding: '2rem', fontFamily: 'system-ui' }}>
        <h1>Notes</h1>
        <p>Необходима авторизация</p>
        <Link href="/login">Войти</Link>
      </main>
    );
  }

  if (isLoading) {
    return (
      <main style={{ padding: '2rem', fontFamily: 'system-ui' }}>
        <h1>Notes</h1>
        <p>Загрузка...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main style={{ padding: '2rem', fontFamily: 'system-ui' }}>
        <h1>Notes</h1>
        <p role="alert" style={{ color: 'red' }}>{error}</p>
        <button onClick={loadNotes}>Обновить</button>
      </main>
    );
  }

  const filteredNotes = notes
    .filter((n) => (showFavoritesOnly ? n.isFavorited : true))
    .filter((n) => n.title.toLowerCase().includes(searchQuery.toLowerCase()));

  async function addNote(): Promise<void> {
    const title = titleInput.trim();
    const content = contentInput.trim();
    if (!title) return;
    try {
      const newNote = await createNote(title, content);
      setNotes((prev) => [...prev, newNote]);
      setTitleInput('');
      setContentInput('');
    } catch {
      setError('Ошибка создания заметки.');
    }
  }

  async function handleDeleteNote(id: string): Promise<void> {
    try {
      await deleteNote(id);
      setNotes((prev) => prev.filter((n) => n.id !== id));
    } catch {
      setError('Ошибка удаления заметки.');
    }
  }

  async function handleToggleFavorite(id: string): Promise<void> {
    try {
      const updated = await toggleFavorite(id);
      setNotes((prev) => prev.map((n) => (n.id === id ? updated : n)));
    } catch {
      setError('Ошибка обновления заметки.');
    }
  }

  function handleLogout(): void {
    clearToken();
    router.push('/login');
  }

  return (
    <main style={{ padding: '2rem', fontFamily: 'system-ui' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Notes</h1>
        <button onClick={handleLogout}>Выйти</button>
      </div>

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
          placeholder="Enter a note"
          style={{ padding: '0.5rem' }}
        />
        <label htmlFor="note-content" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)' }}>
          Note content
        </label>
        <textarea
          id="note-content"
          value={contentInput}
          onChange={(e) => setContentInput(e.target.value)}
          placeholder="Содержание заметки"
          style={{ padding: '0.5rem' }}
        />
        <button type="submit" style={{ padding: '0.5rem 1rem', alignSelf: 'flex-start' }}>
          Add
        </button>
      </form>

      <SearchBar value={searchQuery} onChange={setSearchQuery} />

      <div style={{ marginBottom: '1rem' }}>
        <button
          onClick={() => setShowFavoritesOnly((prev) => !prev)}
          aria-pressed={showFavoritesOnly}
          style={{ padding: '0.25rem 0.5rem' }}
        >
          Только избранные
        </button>
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
            <span>{note.title}</span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => handleToggleFavorite(note.id)}
                data-testid={`favorite-button-${note.id}`}
                aria-label="Toggle favorite"
                style={{ padding: '0.25rem 0.5rem' }}
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
