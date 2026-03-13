'use client';

import NoteForm from '@/components/NoteForm';

const sampleNote = {
  id: '1',
  title: 'Sample Note',
  content: 'This is a sample note for demonstration.',
  createdAt: '2026-03-13T14:30:00.000Z',
};

export default function EditNotePage(): React.ReactElement {
  function handleSubmit(data: { title: string; content: string }): void {
    // TODO: call API to update note
    console.log('Update note:', data);
  }

  return (
    <main style={{ padding: '2rem', fontFamily: 'system-ui', maxWidth: '640px' }}>
      <h1>Edit Note</h1>
      <NoteForm note={sampleNote} onSubmit={handleSubmit} />
    </main>
  );
}
