/** Represents a note returned from the API. */
export interface Note {
  id: number;
  title: string;
  content?: string;
}

/** Fetches notes list from the API with Bearer-token authorization. */
export async function fetchNotes(): Promise<Note[]> {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
  const token = localStorage.getItem('token');

  const headers: HeadersInit = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${baseUrl}/notes`, { headers });

  if (res.status === 401) {
    window.dispatchEvent(new Event('auth:unauthorized'));
    throw new Error('Unauthorized');
  }

  if (!res.ok) {
    throw new Error(`Request failed with status ${res.status}`);
  }

  return res.json() as Promise<Note[]>;
}
