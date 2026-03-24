import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NotesPage from '../page';

vi.mock('@/lib/api', () => ({
  getNotes: vi.fn(),
  createNote: vi.fn(),
  deleteNote: vi.fn(),
  toggleFavorite: vi.fn(),
}));

import { getNotes, createNote, deleteNote, toggleFavorite } from '@/lib/api';

const mockGetNotes = vi.mocked(getNotes);
const mockCreateNote = vi.mocked(createNote);
const mockDeleteNote = vi.mocked(deleteNote);
const mockToggleFavorite = vi.mocked(toggleFavorite);

const sampleNotes = [
  { id: '1', title: 'Note A', content: 'Content A', userId: 'u1', createdAt: '', updatedAt: '', categories: [], isFavorited: false },
  { id: '2', title: 'Note B', content: 'Content B', userId: 'u1', createdAt: '', updatedAt: '', categories: [], isFavorited: true },
];

beforeEach(() => {
  vi.clearAllMocks();
  mockGetNotes.mockResolvedValue([...sampleNotes]);
  mockToggleFavorite.mockImplementation((notes, id) =>
    notes.map((n) => (n.id === id ? { ...n, isFavorited: !n.isFavorited } : n)),
  );
});

afterEach(() => {
  cleanup();
});

describe('NotesPage', () => {
  it('shows loading state initially', () => {
    mockGetNotes.mockReturnValue(new Promise(() => {}));
    render(<NotesPage />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('loads and displays notes from API', async () => {
    render(<NotesPage />);
    await waitFor(() => {
      expect(screen.getByText('Note A')).toBeInTheDocument();
    });
    expect(screen.getByText('Note B')).toBeInTheDocument();
  });

  it('shows loadError when API fails', async () => {
    mockGetNotes.mockRejectedValue(new Error('Network error'));
    render(<NotesPage />);
    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  it('creates a note via form', async () => {
    const user = userEvent.setup();
    const newNote = { id: '3', title: 'New Note', content: 'New Content', userId: 'u1', createdAt: '', updatedAt: '', categories: [], isFavorited: false };
    mockCreateNote.mockResolvedValue(newNote);

    render(<NotesPage />);
    await waitFor(() => expect(screen.getByText('Note A')).toBeInTheDocument());

    await user.type(screen.getByLabelText('Title'), 'New Note');
    await user.type(screen.getByLabelText('Content'), 'New Content');
    await user.click(screen.getByRole('button', { name: 'Add' }));

    await waitFor(() => {
      expect(mockCreateNote).toHaveBeenCalledWith({ title: 'New Note', content: 'New Content' });
    });
  });

  it('deletes a note', async () => {
    const user = userEvent.setup();
    mockDeleteNote.mockResolvedValue(undefined);

    render(<NotesPage />);
    await waitFor(() => expect(screen.getByText('Note A')).toBeInTheDocument());

    const deleteButtons = screen.getAllByRole('button', { name: /Delete/ });
    await user.click(deleteButtons[0]);

    await waitFor(() => {
      expect(screen.queryByText('Note A')).not.toBeInTheDocument();
    });
  });

  it('toggles favorite via button with correct data-testid', async () => {
    const user = userEvent.setup();

    render(<NotesPage />);
    await waitFor(() => expect(screen.getByText('Note A')).toBeInTheDocument());

    const favButton = screen.getByTestId('favorite-button-1');
    expect(favButton).toHaveAttribute('aria-label', 'Toggle favorite');
    expect(favButton).toHaveTextContent('☆');

    await user.click(favButton);

    expect(mockToggleFavorite).toHaveBeenCalled();
  });

  it('filters by favorites when showFavoritesOnly is toggled', async () => {
    const user = userEvent.setup();

    render(<NotesPage />);
    await waitFor(() => expect(screen.getByText('Note A')).toBeInTheDocument());

    const filterBtn = screen.getByRole('button', { name: /Only|All/ });
    await user.click(filterBtn);

    await waitFor(() => {
      expect(screen.queryByText('Note A')).not.toBeInTheDocument();
    });
    expect(screen.getByText('Note B')).toBeInTheDocument();
  });

  it('shows operationError when createNote fails', async () => {
    const user = userEvent.setup();
    mockCreateNote.mockRejectedValue(new Error('Create failed'));

    render(<NotesPage />);
    await waitFor(() => expect(screen.getByText('Note A')).toBeInTheDocument());

    await user.type(screen.getByLabelText('Title'), 'Fail');
    await user.type(screen.getByLabelText('Content'), 'Oops');
    await user.click(screen.getByRole('button', { name: 'Add' }));

    await waitFor(() => {
      expect(screen.getByText('Create failed')).toBeInTheDocument();
    });
  });
});
