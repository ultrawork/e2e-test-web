import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getToken, getNotes, createNote, deleteNote, toggleFavorite, login } from './api';
import type { Note } from '@/types';

const mockNote: Note = {
  id: '1',
  title: 'Test',
  content: 'Test content',
  isFavorited: false,
  categories: [],
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

let mockStorage: Record<string, string> = {};
const mockLocalStorage = {
  getItem: (key: string) => mockStorage[key] ?? null,
  setItem: (key: string, value: string) => { mockStorage[key] = value; },
  removeItem: (key: string) => { delete mockStorage[key]; },
};
const mockLocation = { href: '' };

beforeEach(() => {
  mockStorage = {};
  mockLocation.href = '';
  vi.stubGlobal('window', { localStorage: mockLocalStorage, location: mockLocation });
  vi.stubGlobal('localStorage', mockLocalStorage);
  vi.stubGlobal('fetch', vi.fn());
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('getToken', () => {
  it('returns null when no token in localStorage', () => {
    expect(getToken()).toBeNull();
  });

  it('returns token from localStorage', () => {
    mockStorage['token'] = 'my-jwt';
    expect(getToken()).toBe('my-jwt');
  });
});

describe('getNotes', () => {
  it('sends GET request with auth header', async () => {
    mockStorage['token'] = 'test-token';
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve([mockNote]),
    } as Response);

    const notes = await getNotes();

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/notes',
      expect.objectContaining({
        headers: expect.objectContaining({
          'Authorization': 'Bearer test-token',
          'Content-Type': 'application/json',
        }),
      }),
    );
    expect(notes).toEqual([mockNote]);
  });

  it('throws on non-ok response', async () => {
    mockStorage['token'] = 'test-token';
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ message: 'Server error' }),
    } as unknown as Response);

    await expect(getNotes()).rejects.toThrow('Server error');
  });
});

describe('createNote', () => {
  it('sends POST with body and returns new note', async () => {
    mockStorage['token'] = 'test-token';
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: () => Promise.resolve(mockNote),
    } as unknown as Response);

    const result = await createNote({ title: 'Test', content: 'Test content' });

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/notes',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ title: 'Test', content: 'Test content' }),
      }),
    );
    expect(result).toEqual(mockNote);
  });
});

describe('deleteNote', () => {
  it('sends DELETE request and handles 204', async () => {
    mockStorage['token'] = 'test-token';
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 204,
      json: () => Promise.reject(new Error('no body')),
    } as unknown as Response);

    await expect(deleteNote('1')).resolves.toBeUndefined();

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/notes/1',
      expect.objectContaining({ method: 'DELETE' }),
    );
  });
});

describe('toggleFavorite', () => {
  it('sends PATCH request and returns updated note', async () => {
    mockStorage['token'] = 'test-token';
    const favNote = { ...mockNote, isFavorited: true };
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(favNote),
    } as Response);

    const result = await toggleFavorite('1');

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/notes/1/favorite',
      expect.objectContaining({ method: 'PATCH' }),
    );
    expect(result.isFavorited).toBe(true);
  });
});

describe('login', () => {
  it('sends POST to /auth/login and returns token', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ token: 'jwt-123' }),
    } as Response);

    const result = await login('user@example.com', 'pass');

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/auth/login',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ email: 'user@example.com', password: 'pass' }),
      }),
    );
    expect(result.token).toBe('jwt-123');
  });
});

describe('401 handling', () => {
  it('clears token and redirects on 401', async () => {
    mockStorage['token'] = 'expired-token';

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ message: 'Unauthorized' }),
    } as unknown as Response);

    await expect(getNotes()).rejects.toThrow('Unauthorized');
    expect(mockStorage['token']).toBeUndefined();
    expect(mockLocation.href).toBe('/login');
  });
});
