'use client';

import { useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export default function LoginForm(): React.ReactElement {
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
      localStorage.setItem('auth_token', data.token);
      window.location.href = '/notes';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
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
    </>
  );
}
