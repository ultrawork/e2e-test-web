interface CreatedDateProps {
  date: string | Date | null;
}

function formatDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day}.${month}.${year} ${hours}:${minutes}`;
}

export default function CreatedDate({ date }: CreatedDateProps): React.ReactElement {
  const resolvedDate = date ? new Date(date) : new Date();

  return (
    <p
      style={{ color: '#6b7280', fontSize: '0.875rem', margin: '0.25rem 0 0 0' }}
    >
      {formatDate(resolvedDate)}
    </p>
  );
}
