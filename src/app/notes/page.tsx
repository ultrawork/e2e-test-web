'use client';

import { useState } from 'react';
import NotesCounter from '@/components/NotesCounter';
import SearchBar from '@/components/SearchBar';
import CategoryBadge from '@/components/CategoryBadge';
import { Note, Category } from '@/types';

const DEFAULT_CATEGORIES: Category[] = [
  { id: 1, name: 'Work', color: '#E0E0E0' },
  { id: 2, name: 'Personal', color: '#1976D2' },
  { id: 3, name: 'Urgent', color: '#D32F2F' },
];

export default function NotesPage(): React.ReactElement {
  const [notes, setNotes] = useState<Note[]>([]);
  const [input, setInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);

  const filteredNotes = notes.filter((n) =>
    n.text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  function addNote(): void {
    const text = input.trim();
    if (!text) return;
    const selectedCategories = DEFAULT_CATEGORIES.filter((c) =>
      selectedCategoryIds.includes(c.id)
    );
    setNotes((prev) => [...prev, { id: Date.now(), text, categories: selectedCategories }]);
    setInput('');
    setSelectedCategoryIds([]);
  }

  function deleteNote(id: number): void {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  }

  function toggleCategory(id: number): void {
    setSelectedCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((cid) => cid !== id) : [...prev, id]
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
        style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}
      >
        <div style={{ display: 'flex', gap: '0.5rem' }}>
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
        </div>

        <fieldset style={{ border: 'none', padding: 0, margin: 0, display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <legend style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>Категории</legend>
          {DEFAULT_CATEGORIES.map((cat) => (
            <label key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                id={`cat-${cat.id}`}
                aria-label={cat.name}
                checked={selectedCategoryIds.includes(cat.id)}
                onChange={() => toggleCategory(cat.id)}
              />
              {cat.name}
            </label>
          ))}
        </fieldset>
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
            <div>
              {note.categories.length > 0 && (
                <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
                  {note.categories.map((c) => (
                    <CategoryBadge key={c.id} category={c} size="sm" />
                  ))}
                </div>
              )}
              <span>{note.text}</span>
            </div>
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
