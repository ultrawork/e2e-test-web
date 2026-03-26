'use client';

import React, { useState } from 'react';
import { setToken } from '@/lib/api';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

export default function LoginPage(): React.ReactElement {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(): Promise<void> {
    setError('');
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/auth/dev-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        throw new Error(`Ошибка авторизации: ${response.status}`);
      }
      const data = await response.json();
      setToken(data.token);
      window.location.href = '/notes';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ padding: '2rem', fontFamily: 'system-ui' }}>
      <h1>Вход</h1>

      {error && (
        <p role="alert" style={{ color: 'red', marginBottom: '1rem' }}>
          {error}
        </p>
      )}

      <button
        onClick={handleLogin}
        disabled={loading}
        style={{ padding: '0.5rem 1rem' }}
      >
        {loading ? 'Вход...' : 'Войти (dev)'}
      </button>
    </main>
  );
}
