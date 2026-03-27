'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getToken, login } from '@/lib/api';

export default function LoginPage(): React.ReactElement {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (getToken()) {
      router.push('/notes');
    }
  }, [router]);

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await login(email, password);
      localStorage.setItem('token', data.token);
      router.push('/notes');
    } catch {
      setError('Неверные учётные данные');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ padding: '2rem', fontFamily: 'system-ui', maxWidth: '400px', margin: '0 auto' }}>
      <h1>Вход</h1>

      {error && (
        <p role="alert" style={{ color: 'red', marginBottom: '1rem' }}>
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ display: 'block', width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
          />
        </div>

        <div>
          <label htmlFor="password">Пароль</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ display: 'block', width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
          />
        </div>

        <button type="submit" disabled={loading} style={{ padding: '0.5rem 1rem' }}>
          {loading ? 'Вход...' : 'Войти'}
        </button>
      </form>
    </main>
  );
}
