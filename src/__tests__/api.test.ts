import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const MOCK_BASE_URL = 'http://localhost:3001';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();

// Mock window.location
const locationMock = { href: '' };

beforeEach(() => {
  vi.stubGlobal('localStorage', localStorageMock);
  vi.stubGlobal('window', { location: locationMock, localStorage: localStorageMock });
  vi.stubGlobal('fetch', vi.fn());
  localStorageMock.clear();
  locationMock.href = '';
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('getToken', () => {
  it('returns token from localStorage', async () => {
    localStorageMock.setItem('token', 'test-jwt-token');
    const { getToken } = await import('@/lib/api');
    expect(getToken()).toBe('test-jwt-token');
  });

  it('returns null when no token exists', async () => {
    const { getToken } = await import('@/lib/api');
    expect(getToken()).toBeNull();
  });
});

describe('clearToken', () => {
  it('removes token from localStorage', async () => {
    localStorageMock.setItem('token', 'test-jwt-token');
    const { clearToken } = await import('@/lib/api');
    clearToken();
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('token');
  });
});

describe('apiRequest', () => {
  it('adds Authorization header when token exists', async () => {
    localStorageMock.setItem('token', 'my-token');
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(JSON.stringify({ data: 'test' })),
    });
    vi.stubGlobal('fetch', mockFetch);

    const { apiRequest } = await import('@/lib/api');
    await apiRequest('/api/notes');

    expect(mockFetch).toHaveBeenCalledWith(
      `${MOCK_BASE_URL}/api/notes`,
      expect.objectContaining({
        headers: expect.objectContaining({
          'Authorization': 'Bearer my-token',
        }),
      }),
    );
  });

  it('does not add Authorization header when no token', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(JSON.stringify({ data: 'test' })),
    });
    vi.stubGlobal('fetch', mockFetch);

    const { apiRequest } = await import('@/lib/api');
    await apiRequest('/api/notes');

    const calledHeaders = mockFetch.mock.calls[0][1].headers;
    expect(calledHeaders['Authorization']).toBeUndefined();
  });

  it('does not add Content-Type header when no body', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(JSON.stringify({ data: 'test' })),
    });
    vi.stubGlobal('fetch', mockFetch);

    const { apiRequest } = await import('@/lib/api');
    await apiRequest('/api/notes', { method: 'GET' });

    const calledHeaders = mockFetch.mock.calls[0][1].headers;
    expect(calledHeaders['Content-Type']).toBeUndefined();
  });

  it('adds Content-Type header when body is present', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(JSON.stringify({ id: '1' })),
    });
    vi.stubGlobal('fetch', mockFetch);

    const { apiRequest } = await import('@/lib/api');
    await apiRequest('/api/notes', {
      method: 'POST',
      body: JSON.stringify({ text: 'test' }),
    });

    const calledHeaders = mockFetch.mock.calls[0][1].headers;
    expect(calledHeaders['Content-Type']).toBe('application/json');
  });

  it('clears token and redirects to /login on 401', async () => {
    localStorageMock.setItem('token', 'expired-token');
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ message: 'Unauthorized' }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const { apiRequest } = await import('@/lib/api');
    await expect(apiRequest('/api/notes')).rejects.toThrow();
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('token');
    expect(locationMock.href).toBe('/login');
  });

  it('does not redirect on 401 when skipAuthRedirect is true', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ message: 'Unauthorized' }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const { apiRequest } = await import('@/lib/api');
    await expect(apiRequest('/api/auth/login', { method: 'POST', body: '{}' }, true)).rejects.toThrow();
    expect(locationMock.href).toBe('');
  });

  it('throws error with message on non-401 error', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ message: 'Internal Server Error' }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const { apiRequest } = await import('@/lib/api');
    await expect(apiRequest('/api/notes')).rejects.toThrow('Internal Server Error');
  });

  it('handles empty response body', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(''),
    });
    vi.stubGlobal('fetch', mockFetch);

    const { apiRequest } = await import('@/lib/api');
    const result = await apiRequest<void>('/api/notes/1', { method: 'DELETE' });
    expect(result).toBeUndefined();
  });

  it('passes method and body in options', async () => {
    localStorageMock.setItem('token', 'my-token');
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(JSON.stringify({ id: '1', text: 'new note', createdAt: '2024-01-01' })),
    });
    vi.stubGlobal('fetch', mockFetch);

    const { apiRequest } = await import('@/lib/api');
    await apiRequest('/api/notes', {
      method: 'POST',
      body: JSON.stringify({ text: 'new note' }),
    });

    expect(mockFetch).toHaveBeenCalledWith(
      `${MOCK_BASE_URL}/api/notes`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ text: 'new note' }),
      }),
    );
  });
});

describe('getNotes', () => {
  it('fetches notes from /api/notes', async () => {
    const mockNotes = [{ id: '1', text: 'Note 1', createdAt: '2024-01-01' }];
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(JSON.stringify(mockNotes)),
    });
    vi.stubGlobal('fetch', mockFetch);

    const { getNotes } = await import('@/lib/api');
    const notes = await getNotes();

    expect(notes).toEqual(mockNotes);
    expect(mockFetch).toHaveBeenCalledWith(
      `${MOCK_BASE_URL}/api/notes`,
      expect.objectContaining({ method: 'GET' }),
    );
  });
});

describe('createNote', () => {
  it('posts new note to /api/notes', async () => {
    const mockNote = { id: '1', text: 'New note', createdAt: '2024-01-01' };
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(JSON.stringify(mockNote)),
    });
    vi.stubGlobal('fetch', mockFetch);

    const { createNote } = await import('@/lib/api');
    const note = await createNote('New note');

    expect(note).toEqual(mockNote);
    expect(mockFetch).toHaveBeenCalledWith(
      `${MOCK_BASE_URL}/api/notes`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ title: 'New note', content: 'New note' }),
      }),
    );
  });
});

describe('deleteNote', () => {
  it('sends DELETE to /api/notes/:id', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(''),
    });
    vi.stubGlobal('fetch', mockFetch);

    const { deleteNote } = await import('@/lib/api');
    await deleteNote('abc-123');

    expect(mockFetch).toHaveBeenCalledWith(
      `${MOCK_BASE_URL}/api/notes/abc-123`,
      expect.objectContaining({ method: 'DELETE' }),
    );
  });
});
