import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Category, Note } from '@/types';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    json: () => Promise.resolve(body),
  } as Response;
}

function voidResponse(status = 204): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: 'No Content',
    json: () => Promise.resolve({}),
  } as Response;
}

beforeEach(() => {
  mockFetch.mockReset();
});

describe('handleResponse', () => {
  it('throws an error with status code for non-ok responses', async () => {
    const { handleResponse } = await import('@/lib/api');
    const response = jsonResponse({ message: 'Not found' }, 404);
    await expect(handleResponse(response)).rejects.toThrow('404');
  });

  it('parses JSON for ok responses', async () => {
    const { handleResponse } = await import('@/lib/api');
    const data = { id: '1', name: 'Test' };
    const response = jsonResponse(data);
    await expect(handleResponse(response)).resolves.toEqual(data);
  });
});

describe('Category API', () => {
  it('getCategories fetches GET /api/categories', async () => {
    const categories: Category[] = [
      { id: '1', name: 'Work', color: '#ff0000', createdAt: '2024-01-01T00:00:00Z' },
    ];
    mockFetch.mockResolvedValueOnce(jsonResponse(categories));

    const { getCategories } = await import('@/lib/api');
    const result = await getCategories();

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/categories'),
      expect.objectContaining({ method: 'GET' }),
    );
    expect(result).toEqual(categories);
  });

  it('createCategory sends POST /api/categories with body', async () => {
    const created: Category = { id: '2', name: 'Personal', color: '#00ff00', createdAt: '2024-01-01T00:00:00Z' };
    mockFetch.mockResolvedValueOnce(jsonResponse(created));

    const { createCategory } = await import('@/lib/api');
    const result = await createCategory({ name: 'Personal', color: '#00ff00' });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/categories'),
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Personal', color: '#00ff00' }),
      }),
    );
    expect(result).toEqual(created);
  });

  it('updateCategory sends PUT /api/categories/:id with body', async () => {
    const updated: Category = { id: '2', name: 'Updated', color: '#00ff00', createdAt: '2024-01-01T00:00:00Z' };
    mockFetch.mockResolvedValueOnce(jsonResponse(updated));

    const { updateCategory } = await import('@/lib/api');
    const result = await updateCategory('2', { name: 'Updated' });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/categories/2'),
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ name: 'Updated' }),
      }),
    );
    expect(result).toEqual(updated);
  });

  it('deleteCategory sends DELETE /api/categories/:id', async () => {
    mockFetch.mockResolvedValueOnce(voidResponse());

    const { deleteCategory } = await import('@/lib/api');
    await deleteCategory('2');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/categories/2'),
      expect.objectContaining({ method: 'DELETE' }),
    );
  });
});

describe('Note API', () => {
  const sampleNote: Note = {
    id: '1',
    title: 'Test note',
    content: 'Content',
    categories: [],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  it('getNotes fetches GET /api/notes', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse([sampleNote]));

    const { getNotes } = await import('@/lib/api');
    const result = await getNotes();

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/notes$/),
      expect.objectContaining({ method: 'GET' }),
    );
    expect(result).toEqual([sampleNote]);
  });

  it('getNotes with categoryId appends ?category=id', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse([sampleNote]));

    const { getNotes } = await import('@/lib/api');
    await getNotes('cat-1');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/notes?category=cat-1'),
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('createNote sends POST /api/notes with body', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(sampleNote));

    const { createNote } = await import('@/lib/api');
    const result = await createNote({ title: 'Test note', content: 'Content', categoryIds: [] });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/notes'),
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Test note', content: 'Content', categoryIds: [] }),
      }),
    );
    expect(result).toEqual(sampleNote);
  });

  it('updateNote sends PUT /api/notes/:id with body', async () => {
    const updated = { ...sampleNote, title: 'Updated' };
    mockFetch.mockResolvedValueOnce(jsonResponse(updated));

    const { updateNote } = await import('@/lib/api');
    const result = await updateNote('1', { title: 'Updated' });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/notes/1'),
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ title: 'Updated' }),
      }),
    );
    expect(result).toEqual(updated);
  });

  it('deleteNote sends DELETE /api/notes/:id', async () => {
    mockFetch.mockResolvedValueOnce(voidResponse());

    const { deleteNote } = await import('@/lib/api');
    await deleteNote('1');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/notes/1'),
      expect.objectContaining({ method: 'DELETE' }),
    );
  });
});
