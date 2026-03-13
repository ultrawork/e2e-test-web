'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!response.ok) {
      const body = await response.json();
      setError(body.error || 'Registration failed');
      return;
    }
    router.push('/login');
  }

  return (
    <main style={{ padding: '2rem', fontFamily: 'system-ui', maxWidth: '400px' }}>
      <h1>Register</h1>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ display: 'block', width: '100%', padding: '0.5rem', boxSizing: 'border-box' }} />
        </label>
        <label>
          Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ display: 'block', width: '100%', padding: '0.5rem', boxSizing: 'border-box' }} />
        </label>
        {error && <p role="alert" style={{ color: '#dc2626' }}>{error}</p>}
        <button type="submit" style={{ padding: '0.5rem 1rem' }}>Register</button>
      </form>
    </main>
  );
}
