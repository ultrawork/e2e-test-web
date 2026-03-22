import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  apiFetch,
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  fetchNotes,
  createNote,
  updateNote,
  deleteNote,
} from './api';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

function jsonResponse(data: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  } as unknown as Response;
}

beforeEach(() => {
  mockFetch.mockReset();
});

describe('apiFetch', () => {
  it('makes a request to BASE_URL + path with headers', async () => {
    mockFetch.mockResolvedValue(jsonResponse({ ok: true }));
    await apiFetch('/api/test');
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3001/api/test',
      expect.objectContaining({
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          Authorization: 'Bearer dev-token',
        }),
      }),
    );
  });

  it('throws on non-ok response', async () => {
    mockFetch.mockResolvedValue(jsonResponse('Not Found', 404));
    await expect(apiFetch('/api/missing')).rejects.toThrow('API error 404');
  });
});

describe('categories API', () => {
  it('fetchCategories calls GET /api/categories', async () => {
    const cats = [{ id: '1', name: 'Work', color: '#ff0000', createdAt: '' }];
    mockFetch.mockResolvedValue(jsonResponse(cats));
    const result = await fetchCategories();
    expect(result).toEqual(cats);
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3001/api/categories',
      expect.objectContaining({ headers: expect.any(Object) }),
    );
  });

  it('createCategory sends POST with body', async () => {
    const cat = { id: '1', name: 'Work', color: '#ff0000', createdAt: '' };
    mockFetch.mockResolvedValue(jsonResponse(cat));
    const result = await createCategory({ name: 'Work', color: '#ff0000' });
    expect(result).toEqual(cat);
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3001/api/categories',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: 'Work', color: '#ff0000' }),
      }),
    );
  });

  it('updateCategory sends PUT to /api/categories/:id', async () => {
    const cat = { id: '1', name: 'Updated', color: '#00ff00', createdAt: '' };
    mockFetch.mockResolvedValue(jsonResponse(cat));
    await updateCategory('1', { name: 'Updated', color: '#00ff00' });
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3001/api/categories/1',
      expect.objectContaining({ method: 'PUT' }),
    );
  });

  it('deleteCategory sends DELETE to /api/categories/:id', async () => {
    mockFetch.mockResolvedValue(jsonResponse(undefined));
    await deleteCategory('1');
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3001/api/categories/1',
      expect.objectContaining({ method: 'DELETE' }),
    );
  });
});

describe('notes API', () => {
  it('fetchNotes calls GET /api/notes', async () => {
    mockFetch.mockResolvedValue(jsonResponse([]));
    await fetchNotes();
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3001/api/notes',
      expect.any(Object),
    );
  });

  it('fetchNotes with categoryId adds query param', async () => {
    mockFetch.mockResolvedValue(jsonResponse([]));
    await fetchNotes('cat-1');
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3001/api/notes?category=cat-1',
      expect.any(Object),
    );
  });

  it('createNote sends POST with body', async () => {
    const note = { id: '1', title: 'T', content: 'C', userId: 'u', categories: [], createdAt: '', updatedAt: '' };
    mockFetch.mockResolvedValue(jsonResponse(note));
    await createNote({ title: 'T', content: 'C', categoryIds: ['cat-1'] });
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3001/api/notes',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ title: 'T', content: 'C', categoryIds: ['cat-1'] }),
      }),
    );
  });

  it('updateNote sends PUT to /api/notes/:id', async () => {
    mockFetch.mockResolvedValue(jsonResponse({}));
    await updateNote('1', { title: 'U', content: 'X' });
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3001/api/notes/1',
      expect.objectContaining({ method: 'PUT' }),
    );
  });

  it('deleteNote sends DELETE to /api/notes/:id', async () => {
    mockFetch.mockResolvedValue(jsonResponse(undefined));
    await deleteNote('1');
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3001/api/notes/1',
      expect.objectContaining({ method: 'DELETE' }),
    );
  });
});
