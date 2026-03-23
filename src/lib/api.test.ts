import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getNotes, createNote, deleteNote } from './api';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

function jsonResponse(data: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    json: () => Promise.resolve(data),
  } as Response;
}

beforeEach(() => {
  mockFetch.mockReset();
});

describe('getNotes', () => {
  it('returns an array of notes on success', async () => {
    const notes = [{ id: '1', title: 'Test', content: 'Body', userId: 'u1', categories: [], createdAt: '', updatedAt: '' }];
    mockFetch.mockResolvedValue(jsonResponse(notes));

    const result = await getNotes();

    expect(result).toEqual(notes);
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/notes',
      expect.objectContaining({ headers: expect.any(Object) }),
    );
  });

  it('throws on non-ok response', async () => {
    mockFetch.mockResolvedValue(jsonResponse(null, 500));

    await expect(getNotes()).rejects.toThrow('Request failed: 500');
  });
});

describe('createNote', () => {
  it('sends POST with JSON body and returns created note', async () => {
    const created = { id: '2', title: 'New', content: 'Content', userId: 'u1', categories: [], createdAt: '', updatedAt: '' };
    mockFetch.mockResolvedValue(jsonResponse(created, 201));

    const result = await createNote({ title: 'New', content: 'Content' });

    expect(result).toEqual(created);
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe('http://localhost:3000/api/notes');
    expect(options.method).toBe('POST');
    expect(JSON.parse(options.body)).toEqual({ title: 'New', content: 'Content' });
    expect(options.headers['Content-Type']).toBe('application/json');
  });

  it('throws on non-ok response', async () => {
    mockFetch.mockResolvedValue(jsonResponse(null, 400));

    await expect(createNote({ title: '', content: '' })).rejects.toThrow('Request failed: 400');
  });
});

describe('deleteNote', () => {
  it('sends DELETE without Content-Type header', async () => {
    mockFetch.mockResolvedValue({ ok: true, status: 204, statusText: 'No Content' } as Response);

    await deleteNote('abc');

    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe('http://localhost:3000/api/notes/abc');
    expect(options.method).toBe('DELETE');
    expect(options.headers).toBeUndefined();
  });

  it('throws on non-ok response', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 404, statusText: 'Not Found' } as Response);

    await expect(deleteNote('missing')).rejects.toThrow('Request failed: 404');
  });
});
