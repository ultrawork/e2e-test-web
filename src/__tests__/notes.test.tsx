import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NotesPage from '@/app/notes/page';

describe('Notes page', () => {
  test('SC-003: adding a note shows it in the list and updates counter', async () => {
    const user = userEvent.setup();
    render(<NotesPage />);

    const input = screen.getByPlaceholderText('Enter a note');
    const addButton = screen.getByRole('button', { name: 'Add' });

    await user.type(input, 'Тестовая заметка');
    await user.click(addButton);

    expect(screen.getByText('Тестовая заметка')).toBeInTheDocument();
    expect(input).toHaveValue('');
    expect(screen.getByText('Всего заметок: 1')).toBeInTheDocument();
  });

  test('SC-004: empty input does not add a note', async () => {
    const user = userEvent.setup();
    render(<NotesPage />);

    const addButton = screen.getByRole('button', { name: 'Add' });

    await user.click(addButton);

    expect(screen.getByText('Всего заметок: 0')).toBeInTheDocument();
  });

  test('SC-005: deleting a note removes it and updates counter', async () => {
    const user = userEvent.setup();
    render(<NotesPage />);

    const input = screen.getByPlaceholderText('Enter a note');
    const addButton = screen.getByRole('button', { name: 'Add' });

    await user.type(input, 'Заметка для удаления');
    await user.click(addButton);

    expect(screen.getByText('Всего заметок: 1')).toBeInTheDocument();

    const deleteButton = screen.getByRole('button', { name: 'Delete note: Заметка для удаления' });
    await user.click(deleteButton);

    expect(screen.queryByText('Заметка для удаления')).not.toBeInTheDocument();
    expect(screen.getByText('Всего заметок: 0')).toBeInTheDocument();
  });

  test('SC-006: search filters notes and shows filtered counter', async () => {
    const user = userEvent.setup();
    render(<NotesPage />);

    const input = screen.getByPlaceholderText('Enter a note');
    const addButton = screen.getByRole('button', { name: 'Add' });

    await user.type(input, 'Купить молоко');
    await user.click(addButton);
    await user.type(input, 'Позвонить маме');
    await user.click(addButton);
    await user.type(input, 'Купить хлеб');
    await user.click(addButton);

    expect(screen.getByText('Всего заметок: 3')).toBeInTheDocument();

    const searchInput = screen.getByPlaceholderText('Поиск заметок...');
    await user.type(searchInput, 'Купить');

    expect(screen.getByText('Купить молоко')).toBeInTheDocument();
    expect(screen.getByText('Купить хлеб')).toBeInTheDocument();
    expect(screen.queryByText('Позвонить маме')).not.toBeInTheDocument();
    expect(screen.getByText('Найдено: 2 из 3')).toBeInTheDocument();

    const clearButton = screen.getByRole('button', { name: 'Очистить поиск' });
    await user.click(clearButton);

    expect(screen.getByText('Купить молоко')).toBeInTheDocument();
    expect(screen.getByText('Позвонить маме')).toBeInTheDocument();
    expect(screen.getByText('Купить хлеб')).toBeInTheDocument();
    expect(screen.getByText('Всего заметок: 3')).toBeInTheDocument();
    expect(searchInput).toHaveValue('');
  });

  test('SC-007: search with no results shows empty list and filtered counter', async () => {
    const user = userEvent.setup();
    render(<NotesPage />);

    const input = screen.getByPlaceholderText('Enter a note');
    const addButton = screen.getByRole('button', { name: 'Add' });

    await user.type(input, 'Тестовая заметка');
    await user.click(addButton);

    const searchInput = screen.getByPlaceholderText('Поиск заметок...');
    await user.type(searchInput, 'несуществующий текст');

    expect(screen.queryByText('Тестовая заметка')).not.toBeInTheDocument();
    expect(screen.getByText('Найдено: 0 из 1')).toBeInTheDocument();
  });
});
