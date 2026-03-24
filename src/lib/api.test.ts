import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('api', () => {
  const BASE_URL = 'http://localhost:3000/api';

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    vi.stubEnv('NEXT_PUBLIC_API_URL', BASE_URL);
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  describe('fetchNotes', () => {
    it('sends GET request with auth header and returns notes', async () => {
      const notes = [{ id: '1', title: 'Test', content: 'Body' }];
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(notes),
      });
      localStorage.setItem('token', 'my-token');

      const { fetchNotes } = await import('./api');
      const result = await fetchNotes();

      expect(fetch).toHaveBeenCalledWith(`${BASE_URL}/notes`, {
        headers: {
          Authorization: 'Bearer my-token',
          'Content-Type': 'application/json',
        },
      });
      expect(result).toEqual(notes);
    });

    it('returns empty array on 401', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: false,
        status: 401,
      });

      const { fetchNotes } = await import('./api');
      const result = await fetchNotes();

      expect(result).toEqual([]);
    });

    it('sends request without Authorization when no token', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve([]),
      });

      const { fetchNotes } = await import('./api');
      await fetchNotes();

      expect(fetch).toHaveBeenCalledWith(`${BASE_URL}/notes`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
    });
  });

  describe('createNote', () => {
    it('sends POST request and returns created note', async () => {
      const created = { id: '2', title: 'New', content: 'Content' };
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        status: 201,
        json: () => Promise.resolve(created),
      });
      localStorage.setItem('token', 'tok');

      const { createNote } = await import('./api');
      const result = await createNote('New', 'Content');

      expect(fetch).toHaveBeenCalledWith(`${BASE_URL}/notes`, {
        method: 'POST',
        headers: {
          Authorization: 'Bearer tok',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: 'New', content: 'Content' }),
      });
      expect(result).toEqual(created);
    });

    it('throws on non-ok response', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      const { createNote } = await import('./api');
      await expect(createNote('T', 'C')).rejects.toThrow();
    });
  });

  describe('deleteNote', () => {
    it('sends DELETE request', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        status: 204,
      });
      localStorage.setItem('token', 'tok');

      const { deleteNote } = await import('./api');
      await deleteNote('abc');

      expect(fetch).toHaveBeenCalledWith(`${BASE_URL}/notes/abc`, {
        method: 'DELETE',
        headers: {
          Authorization: 'Bearer tok',
          'Content-Type': 'application/json',
        },
      });
    });

    it('throws on non-ok response', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      const { deleteNote } = await import('./api');
      await expect(deleteNote('abc')).rejects.toThrow();
    });
  });
});
