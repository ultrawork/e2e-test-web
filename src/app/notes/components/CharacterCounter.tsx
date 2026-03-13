interface CharacterCounterProps {
  count: number;
}

export default function CharacterCounter({ count }: CharacterCounterProps): React.ReactElement {
  return (
    <span
      aria-live="polite"
      style={{ color: 'gray', fontSize: '0.75rem' }}
    >
      {count} символов
    </span>
  );
}
