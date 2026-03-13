'use client';

import React from 'react';
import NoteForm from '../components/NoteForm';

export default function CreateNotePage() {
  const handleSubmit = (title: string, content: string): void => {
    console.log('Создание заметки:', { title, content });
  };

  return (
    <main style={{ padding: '2rem', fontFamily: 'system-ui', maxWidth: '640px', margin: '0 auto' }}>
      <h1>Создать заметку</h1>
      <NoteForm onSubmit={handleSubmit} />
    </main>
  );
}
