'use client';

import { useState } from 'react';
import CreatedDate from './CreatedDate';

interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

interface NoteFormProps {
  note?: Note | null;
  onSubmit: (data: { title: string; content: string }) => void;
}

export default function NoteForm({ note, onSubmit }: NoteFormProps): React.ReactElement {
  const [title, setTitle] = useState(note?.title ?? '');
  const [content, setContent] = useState(note?.content ?? '');

  function handleSubmit(e: React.FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    onSubmit({ title, content });
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <section>
        <label htmlFor="note-title" style={{ display: 'block', fontWeight: 600, marginBottom: '0.25rem' }}>
          Title
        </label>
        <input
          id="note-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          style={{ width: '100%', padding: '0.5rem', fontSize: '1rem', boxSizing: 'border-box' }}
        />
        <CreatedDate date={note?.createdAt ?? null} />
      </section>

      <section>
        <label htmlFor="note-content" style={{ display: 'block', fontWeight: 600, marginBottom: '0.25rem' }}>
          Content
        </label>
        <textarea
          id="note-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={6}
          style={{ width: '100%', padding: '0.5rem', fontSize: '1rem', boxSizing: 'border-box' }}
        />
      </section>

      <button type="submit" style={{ padding: '0.5rem 1rem', fontSize: '1rem', cursor: 'pointer', alignSelf: 'flex-start' }}>
        {note ? 'Save' : 'Create'}
      </button>
    </form>
  );
}
