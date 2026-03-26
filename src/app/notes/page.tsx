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
  const [loadError, setLoadError] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [isMutating, setIsMutating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [hasToken, setHasToken] = useState(false);

  const loadNotes = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await getNotes();
      setNotes(data);
    } catch {
      setLoadError('Failed to load notes. Please try again later.');
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
        <p>Authorization required</p>
        <Link href="/login">Log in</Link>
      </main>
    );
  }

  if (isLoading) {
    return (
      <main style={{ padding: '2rem', fontFamily: 'system-ui' }}>
        <h1>Notes</h1>
        <p>Loading...</p>
      </main>
    );
  }

  if (loadError) {
    return (
      <main style={{ padding: '2rem', fontFamily: 'system-ui' }}>
        <h1>Notes</h1>
        <p role="alert" style={{ color: 'red' }}>{loadError}</p>
        <button onClick={loadNotes}>Refresh</button>
      </main>
    );
  }

  const filteredNotes = notes
    .filter((n) => (showFavoritesOnly ? n.isFavorited : true))
    .filter((n) => n.title.toLowerCase().includes(searchQuery.toLowerCase()));

  function showMutationError(message: string): void {
    setMutationError(message);
    setTimeout(() => setMutationError(null), 5000);
  }

  async function addNote(): Promise<void> {
    const title = titleInput.trim();
    const content = contentInput.trim();
    if (!title) return;
    setIsMutating(true);
    try {
      const newNote = await createNote(title, content);
      setNotes((prev) => [...prev, newNote]);
      setTitleInput('');
      setContentInput('');
    } catch {
      showMutationError('Failed to create note.');
    } finally {
      setIsMutating(false);
    }
  }

  async function handleDeleteNote(id: string): Promise<void> {
    setIsMutating(true);
    try {
      await deleteNote(id);
      setNotes((prev) => prev.filter((n) => n.id !== id));
    } catch {
      showMutationError('Failed to delete note.');
    } finally {
      setIsMutating(false);
    }
  }

  async function handleToggleFavorite(id: string): Promise<void> {
    setIsMutating(true);
    try {
      const updated = await toggleFavorite(id);
      setNotes((prev) => prev.map((n) => (n.id === id ? updated : n)));
    } catch {
      showMutationError('Failed to update note.');
    } finally {
      setIsMutating(false);
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
        <button onClick={handleLogout}>Log out</button>
      </div>

      {mutationError && (
        <p role="alert" style={{ color: 'red', marginBottom: '1rem' }}>{mutationError}</p>
      )}

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
          placeholder="Note content"
          style={{ padding: '0.5rem' }}
        />
        <button type="submit" disabled={isMutating} style={{ padding: '0.5rem 1rem', alignSelf: 'flex-start' }}>
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
          Favorites only
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
                disabled={isMutating}
                style={{ padding: '0.25rem 0.5rem' }}
              >
                {note.isFavorited ? '★' : '☆'}
              </button>
              <button
                onClick={() => handleDeleteNote(note.id)}
                aria-label={`Delete note: ${note.title}`}
                disabled={isMutating}
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
