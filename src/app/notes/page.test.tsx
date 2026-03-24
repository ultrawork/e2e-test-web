import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('@/lib/api', () => ({
  fetchNotes: vi.fn(),
  createNote: vi.fn(),
  deleteNote: vi.fn(),
}));

import { fetchNotes, createNote, deleteNote } from '@/lib/api';
import NotesPage from './page';

const mockedFetchNotes = fetchNotes as ReturnType<typeof vi.fn>;
const mockedCreateNote = createNote as ReturnType<typeof vi.fn>;
const mockedDeleteNote = deleteNote as ReturnType<typeof vi.fn>;

describe('NotesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('shows loading state then renders notes from API', async () => {
    mockedFetchNotes.mockResolvedValue([
      { id: '1', title: 'First note', content: 'Body 1' },
      { id: '2', title: 'Second note', content: 'Body 2' },
    ]);

    render(<NotesPage />);

    expect(screen.getByText('Loading...')).toBeTruthy();

    await waitFor(() => {
      expect(screen.getByText('First note')).toBeTruthy();
    });
    expect(screen.getByText('Second note')).toBeTruthy();
    expect(mockedFetchNotes).toHaveBeenCalledOnce();
  });

  it('shows empty list when fetchNotes returns []', async () => {
    mockedFetchNotes.mockResolvedValue([]);

    render(<NotesPage />);

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).toBeNull();
    });
    expect(screen.getByText(/Всего заметок: 0/)).toBeTruthy();
  });

  it('creates a note via API and adds it to the list', async () => {
    mockedFetchNotes.mockResolvedValue([]);
    mockedCreateNote.mockResolvedValue({
      id: '3',
      title: 'Buy milk',
      content: '',
    });

    render(<NotesPage />);
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).toBeNull();
    });

    const user = userEvent.setup();
    await user.type(screen.getByLabelText('New note'), 'Buy milk');
    await user.click(screen.getByRole('button', { name: 'Add' }));

    expect(mockedCreateNote).toHaveBeenCalledWith('Buy milk', 'Buy milk');
    await waitFor(() => {
      expect(screen.getByText('Buy milk')).toBeTruthy();
    });
  });

  it('deletes a note via API and removes it from the list', async () => {
    mockedFetchNotes.mockResolvedValue([
      { id: '10', title: 'To delete', content: '' },
    ]);
    mockedDeleteNote.mockResolvedValue(undefined);

    render(<NotesPage />);
    await waitFor(() => {
      expect(screen.getByText('To delete')).toBeTruthy();
    });

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /Delete note/ }));

    expect(mockedDeleteNote).toHaveBeenCalledWith('10');
    await waitFor(() => {
      expect(screen.queryByText('To delete')).toBeNull();
    });
  });
});
