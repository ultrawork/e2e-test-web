import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NotesPage from '@/app/notes/page';
import * as api from '@/lib/api';

jest.mock('@/lib/api', () => ({
  fetchNotes: jest.fn(),
  createNote: jest.fn(),
  deleteNote: jest.fn(),
  getDevToken: jest.fn(),
  ApiError: class ApiError extends Error {
    status: number;
    constructor(message: string, status: number) {
      super(message);
      this.name = 'ApiError';
      this.status = status;
    }
  },
}));

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
  jest.clearAllMocks();
  mockLocalStorage['token'] = 'test-token';
});

const sampleNotes = [
  { id: '1', title: 'First Note', content: '', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: '2', title: 'Second Note', content: '', createdAt: '2024-01-02', updatedAt: '2024-01-02' },
];

describe('Notes page — loading and display', () => {
  test('shows loading state then notes', async () => {
    (api.fetchNotes as jest.Mock).mockResolvedValueOnce(sampleNotes);

    render(<NotesPage />);

    expect(screen.getByText('Загрузка...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('First Note')).toBeInTheDocument();
      expect(screen.getByText('Second Note')).toBeInTheDocument();
    });

    expect(screen.queryByText('Загрузка...')).not.toBeInTheDocument();
    expect(screen.getByText('Всего заметок: 2')).toBeInTheDocument();
  });

  test('shows error alert and retry button on network error', async () => {
    (api.fetchNotes as jest.Mock).mockRejectedValueOnce(new TypeError('Failed to fetch'));

    render(<NotesPage />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    expect(screen.getByText('Ошибка сети. Проверьте соединение.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Повторить' })).toBeInTheDocument();
  });

  test('shows auth error message on 401', async () => {
    const { ApiError: MockApiError } = jest.requireMock('@/lib/api');
    (api.fetchNotes as jest.Mock).mockRejectedValueOnce(new MockApiError('Unauthorized', 401));

    render(<NotesPage />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    expect(screen.getByText('Ошибка авторизации. Попробуйте ещё раз.')).toBeInTheDocument();
  });

  test('shows auth error message on 403', async () => {
    const { ApiError: MockApiError } = jest.requireMock('@/lib/api');
    (api.fetchNotes as jest.Mock).mockRejectedValueOnce(new MockApiError('Forbidden', 403));

    render(<NotesPage />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    expect(screen.getByText('Ошибка авторизации. Попробуйте ещё раз.')).toBeInTheDocument();
  });

  test('retry button reloads notes', async () => {
    (api.fetchNotes as jest.Mock)
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce(sampleNotes);

    const user = userEvent.setup();
    render(<NotesPage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Повторить' })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Повторить' }));

    await waitFor(() => {
      expect(screen.getByText('First Note')).toBeInTheDocument();
    });

    expect(api.fetchNotes).toHaveBeenCalledTimes(2);
  });
});

describe('Notes page — adding notes', () => {
  test('adds note via API and shows it in list', async () => {
    (api.fetchNotes as jest.Mock).mockResolvedValueOnce([]);
    const newNote = { id: '3', title: 'New Note', content: '', createdAt: '2024-01-03', updatedAt: '2024-01-03' };
    (api.createNote as jest.Mock).mockResolvedValueOnce(newNote);

    const user = userEvent.setup();
    render(<NotesPage />);

    await waitFor(() => expect(screen.getByText('Всего заметок: 0')).toBeInTheDocument());

    await user.type(screen.getByPlaceholderText('Enter a note'), 'New Note');
    await user.click(screen.getByRole('button', { name: 'Add' }));

    await waitFor(() => {
      expect(screen.getByText('New Note')).toBeInTheDocument();
    });

    expect(api.createNote).toHaveBeenCalledWith({ title: 'New Note', content: '' });
    expect(screen.getByText('Всего заметок: 1')).toBeInTheDocument();
  });

  test('clears input after adding note', async () => {
    (api.fetchNotes as jest.Mock).mockResolvedValueOnce([]);
    const newNote = { id: '4', title: 'Test', content: '', createdAt: '2024-01-01', updatedAt: '2024-01-01' };
    (api.createNote as jest.Mock).mockResolvedValueOnce(newNote);

    const user = userEvent.setup();
    render(<NotesPage />);

    await waitFor(() => expect(screen.getByText('Всего заметок: 0')).toBeInTheDocument());

    const input = screen.getByPlaceholderText('Enter a note');
    await user.type(input, 'Test');
    await user.click(screen.getByRole('button', { name: 'Add' }));

    await waitFor(() => expect(input).toHaveValue(''));
  });

  test('empty input does not call createNote', async () => {
    (api.fetchNotes as jest.Mock).mockResolvedValueOnce([]);

    const user = userEvent.setup();
    render(<NotesPage />);

    await waitFor(() => expect(screen.getByText('Всего заметок: 0')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: 'Add' }));

    expect(api.createNote).not.toHaveBeenCalled();
  });

  test('shows error if createNote fails', async () => {
    (api.fetchNotes as jest.Mock).mockResolvedValueOnce([]);
    (api.createNote as jest.Mock).mockRejectedValueOnce(new TypeError('Failed to fetch'));

    const user = userEvent.setup();
    render(<NotesPage />);

    await waitFor(() => expect(screen.getByText('Всего заметок: 0')).toBeInTheDocument());

    await user.type(screen.getByPlaceholderText('Enter a note'), 'New Note');
    await user.click(screen.getByRole('button', { name: 'Add' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });
});

describe('Notes page — deleting notes', () => {
  test('deletes note via API and removes from list', async () => {
    (api.fetchNotes as jest.Mock).mockResolvedValueOnce([sampleNotes[0]]);
    (api.deleteNote as jest.Mock).mockResolvedValueOnce(undefined);

    const user = userEvent.setup();
    render(<NotesPage />);

    await waitFor(() => {
      expect(screen.getByText('First Note')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Delete note: First Note' }));

    await waitFor(() => {
      expect(screen.queryByText('First Note')).not.toBeInTheDocument();
    });

    expect(api.deleteNote).toHaveBeenCalledWith('1');
    expect(screen.getByText('Всего заметок: 0')).toBeInTheDocument();
  });

  test('shows error if deleteNote fails', async () => {
    (api.fetchNotes as jest.Mock).mockResolvedValueOnce([sampleNotes[0]]);
    (api.deleteNote as jest.Mock).mockRejectedValueOnce(new TypeError('Failed to fetch'));

    const user = userEvent.setup();
    render(<NotesPage />);

    await waitFor(() => {
      expect(screen.getByText('First Note')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Delete note: First Note' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });
});

describe('Notes page — dev token', () => {
  test('calls getDevToken in dev mode when no token in localStorage', async () => {
    delete mockLocalStorage['token'];
    const originalEnv = process.env.NODE_ENV;
    Object.defineProperty(process.env, 'NODE_ENV', { value: 'development', writable: true });

    (api.getDevToken as jest.Mock).mockResolvedValueOnce('auto-dev-token');
    (api.fetchNotes as jest.Mock).mockResolvedValueOnce([]);

    render(<NotesPage />);

    await waitFor(() => {
      expect(screen.getByText('Всего заметок: 0')).toBeInTheDocument();
    });

    expect(api.getDevToken).toHaveBeenCalled();

    Object.defineProperty(process.env, 'NODE_ENV', { value: originalEnv, writable: true });
  });
});

describe('Notes page — search', () => {
  test('filters notes by title on search', async () => {
    (api.fetchNotes as jest.Mock).mockResolvedValueOnce(sampleNotes);

    const user = userEvent.setup();
    render(<NotesPage />);

    await waitFor(() => {
      expect(screen.getByText('First Note')).toBeInTheDocument();
    });

    await user.type(screen.getByPlaceholderText('Поиск заметок...'), 'First');

    expect(screen.getByText('First Note')).toBeInTheDocument();
    expect(screen.queryByText('Second Note')).not.toBeInTheDocument();
    expect(screen.getByText('Найдено: 1 из 2')).toBeInTheDocument();
  });
});
