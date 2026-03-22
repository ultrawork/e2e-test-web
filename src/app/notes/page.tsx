'use client';

import { useState } from 'react';
import NotesCounter from '@/components/NotesCounter';
import SearchBar from '@/components/SearchBar';
import FiltersBar from '@/components/FiltersBar';
import NoteItem from '@/components/NoteItem';

interface Note {
  id: number;
  text: string;
  isFavorited: boolean;
}

export default function NotesPage(): React.ReactElement {
  const [notes, setNotes] = useState<Note[]>([]);
  const [input, setInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [favoritesFilter, setFavoritesFilter] = useState(false);

  const filteredNotes = notes.filter((n) => {
    const matchesSearch = n.text.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFavorites = !favoritesFilter || n.isFavorited;
    return matchesSearch && matchesFavorites;
  });

  const isFiltering = !!searchQuery || favoritesFilter;

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

      <SearchBar value={searchQuery} onChange={setSearchQuery} />

      <FiltersBar favoritesOnly={favoritesFilter} onFavoritesChange={setFavoritesFilter} />

      <NotesCounter totalCount={notes.length} filteredCount={isFiltering ? filteredNotes.length : undefined} />

      <ul style={{ listStyle: 'none', padding: 0 }}>
        {filteredNotes.map((note) => (
          <NoteItem key={note.id} note={note} onDelete={deleteNote} onToggleFavorite={toggleFavorite} />
        ))}
      </ul>
    </main>
  );
}
