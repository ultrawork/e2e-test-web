import Link from 'next/link';

export default function Home(): React.ReactElement {
  return (
    <main style={{ padding: '2rem', fontFamily: 'system-ui' }}>
      <h1>Notes App</h1>
      <p>Welcome to the Notes App. Login or register to get started.</p>
      <nav style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
        <Link href="/notes">Go to Notes</Link>
        <Link href="/login">Log in</Link>
      </nav>
    </main>
  );
}
