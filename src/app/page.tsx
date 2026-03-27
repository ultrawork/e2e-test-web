import Link from 'next/link';

export default function Home(): React.ReactElement {
  return (
    <main style={{ padding: '2rem', fontFamily: 'system-ui' }} data-testid="home-page">
      <h1>Notes App</h1>
      <p>Welcome to the Notes App. Login or register to get started.</p>
      <nav aria-label="main" style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
        <Link href="/login">Войти</Link>
        <Link href="/notes">Go to Notes</Link>
      </nav>
    </main>
  );
}
