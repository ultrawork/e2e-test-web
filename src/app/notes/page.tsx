'use client';

import { useState } from 'react';
import NotesCounter from '@/components/NotesCounter';
import SearchBar from '@/components/SearchBar';

interface Note {
  id: number;
  text: string;
  isFavorited: boolean;
}

export default function NotesPage(): React.ReactElement {
  const [notes, setNotes] = useState<Note[]>([]);
  const [input, setInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const filteredNotes = notes
    .filter((n) => (showFavoritesOnly ? n.isFavorited : true))
    .filter((n) => n.text.toLowerCase().includes(searchQuery.toLowerCase()));

  function addNote(): void {
    const text = input.trim();
    if (!text) return;
    setNotes((prev) => [...prev, { id: Date.now(), text, isFavorited: false }]);
    setInput('');
  }

  function deleteNote(id: number): void {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  }

  function toggleFavorite(id: number): void {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, isFavorited: !n.isFavorited } : n)));
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

      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '1rem' }}>
        <SearchBar value={searchQuery} onChange={setSearchQuery} />
        <button
          onClick={() => setShowFavoritesOnly((v) => !v)}
          aria-pressed={showFavoritesOnly}
          style={{ padding: '0.5rem 1rem', whiteSpace: 'nowrap' }}
        >
          Только избранные
        </button>
      </div>

      <NotesCounter
        totalCount={notes.length}
        filteredCount={showFavoritesOnly || searchQuery ? filteredNotes.length : undefined}
      />

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
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => toggleFavorite(note.id)}
                aria-label="Toggle favorite"
                data-testid={`favorite-button-${note.id}`}
                style={{ padding: '0.25rem 0.5rem' }}
              >
                {note.isFavorited ? '★' : '☆'}
              </button>
              <button
                onClick={() => deleteNote(note.id)}
                aria-label={`Delete note: ${note.text}`}
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
