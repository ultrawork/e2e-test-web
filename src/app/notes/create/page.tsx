'use client';

import NoteForm from '@/components/NoteForm';

export default function CreateNotePage(): React.ReactElement {
  function handleSubmit(data: { title: string; content: string }): void {
    // TODO: call API to create note
    console.log('Create note:', data);
  }

  return (
    <main style={{ padding: '2rem', fontFamily: 'system-ui', maxWidth: '640px' }}>
      <h1>Create Note</h1>
      <NoteForm onSubmit={handleSubmit} />
    </main>
  );
}
