import Link from 'next/link';

export default function Home() {
  return (
    <main style={{ padding: '2rem', fontFamily: 'system-ui' }}>
      <h1>Notes App</h1>
      <p>Login or register to get started</p>
      <nav style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
        <Link href="/login">Login</Link>
        <Link href="/register">Register</Link>
      </nav>
    </main>
  );
}
