'use client';

import { useRouter } from 'next/navigation';
import NoteForm from '@/components/NoteForm';

async function ensureToken(): Promise<string> {
  if (typeof window === 'undefined') return '';
  let token = localStorage.getItem('accessToken');
  if (token) return token;

  // Auto-create guest session
  const guestEmail = `guest_${Date.now()}@notes.local`;
  await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: guestEmail, password: 'guest' }),
  });
  const loginResp = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: guestEmail, password: 'guest' }),
  });
  if (loginResp.ok) {
    const body = await loginResp.json();
    token = body.accessToken;
    localStorage.setItem('accessToken', token!);
    return token!;
  }
  return '';
}

export default function CreateNotePage(): React.ReactElement {
  const router = useRouter();

  async function handleSubmit(data: { title: string; content: string }): Promise<void> {
    const token = await ensureToken();
    const response = await fetch('/api/notes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('Failed to create note');
    }
    router.push('/');
  }

  return (
    <main style={{ padding: '2rem', fontFamily: 'system-ui', maxWidth: '640px' }}>
      <h1>Create Note</h1>
      <NoteForm onSubmit={handleSubmit} />
    </main>
  );
}
