import { fetchNotes, createNote, deleteNote, getDevToken, ApiError } from '@/lib/api';

const mockLocalStorage: Record<string, string> = {};

beforeAll(() => {
  Object.defineProperty(window, 'localStorage', {
    value: {
      getItem: (key: string) => mockLocalStorage[key] ?? null,
      setItem: (key: string, value: string) => { mockLocalStorage[key] = value; },
      removeItem: (key: string) => { delete mockLocalStorage[key]; },
      clear: () => { Object.keys(mockLocalStorage).forEach(k => delete mockLocalStorage[k]); },
    },
    writable: true,
  });
});

beforeEach(() => {
  Object.keys(mockLocalStorage).forEach(k => delete mockLocalStorage[k]);
  jest.resetAllMocks();
  global.fetch = jest.fn();
});

function mockFetch(status: number, body: unknown, headers?: Record<string, string>) {
  const responseHeaders = new Headers({ 'Content-Type': 'application/json', ...headers });
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : status === 401 ? 'Unauthorized' : status === 404 ? 'Not Found' : 'Error',
    headers: responseHeaders,
    json: () => Promise.resolve(body),
  });
}

function mockFetchNoContent(status: number = 204) {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: true,
    status,
    statusText: 'No Content',
    headers: new Headers(),
    json: () => Promise.reject(new SyntaxError('No body')),
  });
}

function mockNetworkError() {
  (global.fetch as jest.Mock).mockRejectedValueOnce(new TypeError('Failed to fetch'));
}

describe('ApiError', () => {
  test('should have message and status', () => {
    const err = new ApiError('Not found', 404);
    expect(err.message).toBe('Not found');
    expect(err.status).toBe(404);
    expect(err instanceof ApiError).toBe(true);
    expect(err instanceof Error).toBe(true);
    expect(err.name).toBe('ApiError');
  });
});

describe('fetchNotes', () => {
  test('returns notes array on success', async () => {
    const notes = [
      { id: '1', title: 'Test', content: '', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
    ];
    mockFetch(200, notes);

    const result = await fetchNotes();

    expect(result).toEqual(notes);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/notes'),
      expect.objectContaining({ headers: expect.anything() }),
    );
  });

  test('sends Authorization header when token exists', async () => {
    mockLocalStorage['token'] = 'my-jwt-token';
    mockFetch(200, []);

    await fetchNotes();

    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer my-jwt-token' }),
      }),
    );
  });

  test('throws ApiError on 401', async () => {
    mockFetch(401, { message: 'Unauthorized' });

    await expect(fetchNotes()).rejects.toMatchObject({ status: 401 });
  });

  test('throws ApiError on 500', async () => {
    mockFetch(500, { message: 'Internal Server Error' });

    await expect(fetchNotes()).rejects.toBeInstanceOf(ApiError);
  });

  test('throws on network error', async () => {
    mockNetworkError();

    await expect(fetchNotes()).rejects.toThrow('Failed to fetch');
  });
});

describe('createNote', () => {
  test('returns created note on success', async () => {
    const created = { id: 'abc', title: 'New Note', content: '', createdAt: '2024-01-01', updatedAt: '2024-01-01' };
    mockFetch(201, created);

    const result = await createNote({ title: 'New Note', content: '' });

    expect(result).toEqual(created);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/notes'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ title: 'New Note', content: '' }),
      }),
    );
  });

  test('throws ApiError on 400', async () => {
    mockFetch(400, { message: 'Bad Request' });

    await expect(createNote({ title: '', content: '' })).rejects.toBeInstanceOf(ApiError);
  });
});

describe('deleteNote', () => {
  test('resolves on 204', async () => {
    mockFetchNoContent(204);

    await expect(deleteNote('note-id-1')).resolves.toBeUndefined();
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/notes/note-id-1'),
      expect.objectContaining({ method: 'DELETE' }),
    );
  });

  test('throws ApiError on 404', async () => {
    mockFetch(404, { message: 'Not Found' });

    await expect(deleteNote('missing-id')).rejects.toBeInstanceOf(ApiError);
  });
});

describe('getDevToken', () => {
  test('fetches token and stores in localStorage', async () => {
    mockFetch(200, { token: 'dev-token-123' });

    const token = await getDevToken();

    expect(token).toBe('dev-token-123');
    expect(mockLocalStorage['token']).toBe('dev-token-123');
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/auth/dev-token'),
      expect.objectContaining({ method: 'POST' }),
    );
  });

  test('throws ApiError if endpoint returns error', async () => {
    mockFetch(500, { message: 'Service unavailable' });

    await expect(getDevToken()).rejects.toBeInstanceOf(ApiError);
  });
});
