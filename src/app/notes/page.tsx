'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

export default function NotesListPage() {
  const router = useRouter();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchNotes() {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      if (!token) {
        setLoading(false);
        return;
      }
      const response = await fetch('/api/notes', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.status === 401) {
        setLoading(false);
        return;
      }
      if (response.ok) {
        const data = await response.json();
        setNotes(data);
      }
      setLoading(false);
    }
    fetchNotes();
  }, [router]);

  async function handleDelete(id: string) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (!token) return;
    const response = await fetch(`/api/notes/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.ok) {
      setNotes((prev) => prev.filter((n) => n.id !== id));
    }
  }

  function handleLogout() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
    }
    router.push('/');
  }

  if (loading) {
    return <main style={{ padding: '2rem', fontFamily: 'system-ui' }}><p>Loading...</p></main>;
  }

  return (
    <main style={{ padding: '2rem', fontFamily: 'system-ui', maxWidth: '640px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Notes</h1>
        <button onClick={handleLogout} style={{ padding: '0.5rem 1rem' }}>Logout</button>
      </div>
      <Link href="/notes/create" style={{ display: 'inline-block', marginBottom: '1rem' }}>Create Note</Link>
      {notes.length === 0 ? (
        <p>No notes yet.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {notes.map((note) => (
            <li key={note.id} data-testid="note-item" style={{ border: '1px solid #ddd', padding: '1rem', marginBottom: '0.5rem', borderRadius: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Link href={`/notes/edit/${note.id}`}><strong>{note.title}</strong></Link>
                <button onClick={() => handleDelete(note.id)} style={{ color: '#dc2626' }}>Delete</button>
              </div>
              <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: '0.25rem 0 0 0' }}>{note.createdAt}</p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
