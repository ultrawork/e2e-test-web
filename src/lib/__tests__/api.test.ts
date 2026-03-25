import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getToken, setToken, clearToken, getNotes, createNote, deleteNote } from '../api';

const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(globalThis, 'localStorage', { value: mockLocalStorage });

const originalLocation = globalThis.window?.location;

beforeEach(() => {
  mockLocalStorage.clear();
  vi.restoreAllMocks();

  Object.defineProperty(globalThis, 'window', {
    value: { location: { href: '' } },
    writable: true,
    configurable: true,
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('token management', () => {
  it('getToken returns null when no token stored', () => {
    expect(getToken()).toBeNull();
  });

  it('setToken stores token in localStorage', () => {
    setToken('abc123');
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('token', 'abc123');
  });

  it('getToken returns stored token', () => {
    setToken('abc123');
    expect(getToken()).toBe('abc123');
  });

  it('clearToken removes token from localStorage', () => {
    setToken('abc123');
    clearToken();
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('token');
  });
});

describe('getNotes', () => {
  it('fetches notes from API with authorization header', async () => {
    const mockNotes = [{ id: '1', title: 'Test', content: '', userId: 'u1', createdAt: '', updatedAt: '', categories: [] }];
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(mockNotes), { status: 200 })
    );

    setToken('mytoken');
    const notes = await getNotes();

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/api/notes'),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer mytoken',
        }),
      }),
    );
    expect(notes).toEqual(mockNotes);
  });
});

describe('createNote', () => {
  it('sends POST request with title and content equal to title', async () => {
    const mockNote = { id: '2', title: 'New', content: 'New', userId: 'u1', createdAt: '', updatedAt: '', categories: [] };
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(mockNote), { status: 201 })
    );

    setToken('mytoken');
    const note = await createNote('New');

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/api/notes'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ title: 'New', content: 'New' }),
      }),
    );
    expect(note).toEqual(mockNote);
  });
});

describe('deleteNote', () => {
  it('sends DELETE request for given note id', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(null, { status: 204 })
    );

    setToken('mytoken');
    await deleteNote('note-1');

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/api/notes/note-1'),
      expect.objectContaining({
        method: 'DELETE',
      }),
    );
  });
});

describe('apiRequest 401 handling', () => {
  it('clears token and redirects on 401', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('Unauthorized', { status: 401 })
    );

    setToken('expired-token');

    await expect(getNotes()).rejects.toThrow();
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('token');
    expect(window.location.href).toBe('/login');
  });
});
