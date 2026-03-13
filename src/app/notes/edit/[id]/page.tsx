'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import NoteForm from '@/components/NoteForm';

interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

export default function EditNotePage(): React.ReactElement {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchNote(): Promise<void> {
      try {
        const response = await fetch(`/api/notes/${params.id}`);
        if (!response.ok) {
          setError('Failed to load note');
          return;
        }
        const data: Note = await response.json();
        setNote(data);
      } catch {
        setError('Failed to load note');
      } finally {
        setLoading(false);
      }
    }
    fetchNote();
  }, [params.id]);

  async function handleSubmit(data: { title: string; content: string }): Promise<void> {
    const response = await fetch(`/api/notes/${params.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('Failed to save note');
    }
    router.push('/');
  }

  if (loading) {
    return (
      <main style={{ padding: '2rem', fontFamily: 'system-ui', maxWidth: '640px' }}>
        <p>Loading...</p>
      </main>
    );
  }

  if (error || !note) {
    return (
      <main style={{ padding: '2rem', fontFamily: 'system-ui', maxWidth: '640px' }}>
        <p>{error ?? 'Note not found'}</p>
      </main>
    );
  }

  return (
    <main style={{ padding: '2rem', fontFamily: 'system-ui', maxWidth: '640px' }}>
      <h1>Edit Note</h1>
      <NoteForm note={note} onSubmit={handleSubmit} />
    </main>
  );
}
