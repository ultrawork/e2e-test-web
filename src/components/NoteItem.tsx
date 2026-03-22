interface NoteItemProps {
  note: { id: number; text: string; isFavorited: boolean };
  onDelete: (id: number) => void;
  onToggleFavorite: (id: number) => void;
}

export default function NoteItem({ note, onDelete, onToggleFavorite }: NoteItemProps): React.ReactElement {
  return (
    <li
      data-testid={`note-${note.text}`}
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0.5rem 0',
        borderBottom: '1px solid #eee',
      }}
    >
      <span>{note.text}</span>
      <div style={{ display: 'flex', gap: '0.25rem' }}>
        <button
          onClick={() => onToggleFavorite(note.id)}
          data-testid={`fav-${note.text}`}
          aria-label={`Toggle favorite: ${note.text}`}
          style={{ padding: '0.25rem 0.5rem', cursor: 'pointer', background: 'none', border: 'none', fontSize: '1.2rem' }}
        >
          {note.isFavorited ? '\u2605' : '\u2606'}
        </button>
        <button
          onClick={() => onDelete(note.id)}
          aria-label={`Delete note: ${note.text}`}
          data-testid={`delete-${note.text}`}
          style={{ padding: '0.25rem 0.5rem' }}
        >
          Delete
        </button>
      </div>
    </li>
  );
}
