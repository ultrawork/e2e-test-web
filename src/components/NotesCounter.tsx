interface NotesCounterProps {
  totalCount: number;
  filteredCount?: number;
}

export default function NotesCounter({ totalCount, filteredCount }: NotesCounterProps): React.ReactElement {
  const text =
    filteredCount !== undefined
      ? `Найдено: ${filteredCount} из ${totalCount}`
      : `Всего заметок: ${totalCount}`;

  return (
    <p role="status" aria-live="polite" data-testid="notes-counter" style={{ marginBottom: '1rem', color: '#555' }}>
      {text}
    </p>
  );
}
