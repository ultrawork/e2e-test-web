'use client';

import { useRouter } from 'next/navigation';
import NoteForm from '@/components/NoteForm';

export default function CreateNotePage(): React.ReactElement {
  const router = useRouter();

  async function handleSubmit(data: { title: string; content: string }): Promise<void> {
    await fetch('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    router.push('/');
  }

  return (
    <main style={{ padding: '2rem', fontFamily: 'system-ui', maxWidth: '640px' }}>
      <h1>Create Note</h1>
      <NoteForm onSubmit={handleSubmit} />
    </main>
  );
}
