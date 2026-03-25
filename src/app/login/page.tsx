'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getToken, setToken } from '@/lib/api';
import type { LoginResponse } from '@/types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

export default function LoginPage(): React.ReactElement {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (getToken()) {
      router.push('/notes');
    } else {
      setLoading(false);
    }
  }, [router]);

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch(`${BASE_URL}/api/auth/dev-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        setError('Ошибка авторизации');
        return;
      }

      const data: LoginResponse = await res.json();
      setToken(data.token);
      router.push('/notes');
    } catch {
      setError('Ошибка сети');
    }
  }

  if (loading) {
    return <main style={{ padding: '2rem', fontFamily: 'system-ui' }}><p>Загрузка...</p></main>;
  }

  return (
    <main style={{ padding: '2rem', fontFamily: 'system-ui' }}>
      <h1>Вход</h1>
      <form onSubmit={handleSubmit}>
        <button type="submit" style={{ padding: '0.5rem 1rem' }}>
          Войти
        </button>
      </form>
      {error && <p role="alert" style={{ color: 'red', marginTop: '1rem' }}>{error}</p>}
    </main>
  );
}
