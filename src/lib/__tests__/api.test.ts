import type { Category, Note } from '@/types';
import {
  handleResponse,
  handleEmptyResponse,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getNotes,
  createNote,
  updateNote,
  deleteNote,
} from '@/lib/api';

const mockFetch = jest.fn();
global.fetch = mockFetch;

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
    const response = jsonResponse({ message: 'Not found' }, 404);
    await expect(handleResponse(response)).rejects.toThrow('HTTP 404: Not found');
  });

  it('parses JSON for ok responses', async () => {
    const data = { id: '1', name: 'Test' };
    const response = jsonResponse(data);
    await expect(handleResponse(response)).resolves.toEqual(data);
  });

  it('falls back to statusText when JSON parsing fails', async () => {
    const response = {
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: () => Promise.reject(new Error('invalid json')),
    } as Response;
    await expect(handleResponse(response)).rejects.toThrow('HTTP 500: Internal Server Error');
  });
});

describe('handleEmptyResponse', () => {
  it('throws an error for non-ok responses', async () => {
    const response = jsonResponse({ message: 'Forbidden' }, 403);
    await expect(handleEmptyResponse(response)).rejects.toThrow('HTTP 403: Forbidden');
  });

  it('resolves for ok responses without parsing body', async () => {
    const response = voidResponse(204);
    await expect(handleEmptyResponse(response)).resolves.toBeUndefined();
  });
});

describe('Category API', () => {
  it('getCategories fetches GET /api/categories', async () => {
    const categories: Category[] = [
      { id: '1', name: 'Work', color: '#ff0000', createdAt: '2024-01-01T00:00:00Z' },
    ];
    mockFetch.mockResolvedValueOnce(jsonResponse(categories));

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

    const result = await getNotes();

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/notes$/),
      expect.objectContaining({ method: 'GET' }),
    );
    expect(result).toEqual([sampleNote]);
  });

  it('getNotes with categoryId appends ?categoryId=id', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse([sampleNote]));

    await getNotes('cat-1');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/notes?categoryId=cat-1'),
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('createNote sends POST /api/notes with body', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(sampleNote));

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

    await deleteNote('1');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/notes/1'),
      expect.objectContaining({ method: 'DELETE' }),
    );
  });
});
