'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, password: password }),
      });
      if (!response.ok) {
        setError('Invalid email or password');
        return;
      }
      const body = await response.json();
      localStorage.setItem('accessToken', body.accessToken);
      router.push('/notes');
    } catch {
      setError('Failed to login');
    }
  }

  return (
    <main style={{ padding: '2rem', fontFamily: 'system-ui', maxWidth: '400px' }}>
      <h1>Login</h1>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label htmlFor="login-email">Email</label>
          <input id="login-email" type="email" value={email} onChange={function(e) { setEmail(e.target.value); }} style={{ display: 'block', width: '100%', padding: '0.5rem', boxSizing: 'border-box' }} />
        </div>
        <div>
          <label htmlFor="login-password">Password</label>
          <input id="login-password" type="password" value={password} onChange={function(e) { setPassword(e.target.value); }} style={{ display: 'block', width: '100%', padding: '0.5rem', boxSizing: 'border-box' }} />
        </div>
        {error && <p role="alert" style={{ color: '#dc2626' }}>{error}</p>}
        <button type="submit" style={{ padding: '0.5rem 1rem' }}>Login</button>
      </form>
    </main>
  );
}
