'use client';

import { useRouter } from 'next/navigation';
import NoteForm from '@/components/NoteForm';

export default function CreateNotePage() {
  const router = useRouter();

  async function handleSubmit(data: { title: string; content: string }) {
    let token = '';
    if (typeof window !== 'undefined') {
      token = localStorage.getItem('accessToken') || '';
    }

    if (!token) {
      // Auto-create guest session
      const guestEmail = 'guest_' + Date.now() + '@notes.local';
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
        const loginBody = await loginResp.json();
        token = loginBody.accessToken;
        localStorage.setItem('accessToken', token);
      }
    }

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = 'Bearer ' + token;
    }

    const response = await fetch('/api/notes', {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('Failed to create note');
    }
    router.push('/notes');
  }

  return (
    <main style={{ padding: '2rem', fontFamily: 'system-ui', maxWidth: '640px' }}>
      <h1>Create Note</h1>
      <NoteForm onSubmit={handleSubmit} />
    </main>
  );
}
