'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, password: password }),
      });
      if (!response.ok) {
        const body = await response.json();
        setError(body.error || 'Registration failed');
        return;
      }
      router.push('/login');
    } catch {
      setError('Failed to register');
    }
  }

  return (
    <main style={{ padding: '2rem', fontFamily: 'system-ui', maxWidth: '400px' }}>
      <h1>Register</h1>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label htmlFor="reg-email">Email</label>
          <input id="reg-email" type="email" value={email} onChange={function(e) { setEmail(e.target.value); }} style={{ display: 'block', width: '100%', padding: '0.5rem', boxSizing: 'border-box' }} />
        </div>
        <div>
          <label htmlFor="reg-password">Password</label>
          <input id="reg-password" type="password" value={password} onChange={function(e) { setPassword(e.target.value); }} style={{ display: 'block', width: '100%', padding: '0.5rem', boxSizing: 'border-box' }} />
        </div>
        {error && <p role="alert" style={{ color: '#dc2626' }}>{error}</p>}
        <button type="submit" style={{ padding: '0.5rem 1rem' }}>Register</button>
      </form>
    </main>
  );
}
