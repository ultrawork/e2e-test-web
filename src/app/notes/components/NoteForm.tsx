'use client';

import React, { useState, type FormEvent } from 'react';
import CharacterCounter from './CharacterCounter';

interface NoteFormProps {
  initialTitle?: string;
  initialContent?: string;
  onSubmit: (title: string, content: string) => void;
}

export default function NoteForm({ initialTitle = '', initialContent = '', onSubmit }: NoteFormProps) {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);

  const handleSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    onSubmit(title, content);
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div>
        <label htmlFor="note-title" style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 'bold' }}>
          Заголовок
        </label>
        <input
          id="note-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Введите заголовок"
          style={{ width: '100%', padding: '0.5rem', fontSize: '1rem', boxSizing: 'border-box' }}
        />
      </div>
      <div>
        <label htmlFor="note-content" style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 'bold' }}>
          Текст заметки
        </label>
        <textarea
          id="note-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Введите текст заметки"
          rows={8}
          style={{ width: '100%', padding: '0.5rem', fontSize: '1rem', boxSizing: 'border-box', resize: 'vertical' }}
        />
        <CharacterCounter count={content.length} />
      </div>
      <button type="submit" style={{ padding: '0.5rem 1rem', fontSize: '1rem', cursor: 'pointer', alignSelf: 'flex-start' }}>
        Сохранить
      </button>
    </form>
  );
}
