'use client';

import { useParams } from 'next/navigation';
import NoteForm from '../../components/NoteForm';

const mockNotes: Record<string, { title: string; content: string }> = {
  '1': { title: 'Первая заметка', content: 'Содержимое первой заметки' },
  '2': { title: 'Вторая заметка', content: 'Содержимое второй заметки' },
};

export default function EditNotePage() {
  const params = useParams();
  const id = params.id as string;
  const note = mockNotes[id];

  const handleSubmit = (title: string, content: string): void => {
    console.log('Обновление заметки:', { id, title, content });
  };

  if (!note) {
    return (
      <main style={{ padding: '2rem', fontFamily: 'system-ui', maxWidth: '640px', margin: '0 auto' }}>
        <h1>Заметка не найдена</h1>
      </main>
    );
  }

  return (
    <main style={{ padding: '2rem', fontFamily: 'system-ui', maxWidth: '640px', margin: '0 auto' }}>
      <h1>Редактировать заметку</h1>
      <NoteForm initialTitle={note.title} initialContent={note.content} onSubmit={handleSubmit} />
    </main>
  );
}
