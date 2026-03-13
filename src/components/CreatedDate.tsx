'use client';

import { useState, useEffect } from 'react';

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

function parseDate(date: string | Date): Date | null {
  const parsed = new Date(date);
  if (isNaN(parsed.getTime())) {
    return null;
  }
  return parsed;
}

export default function CreatedDate({ date }: CreatedDateProps): React.ReactElement | null {
  const [currentDate, setCurrentDate] = useState<Date | null>(null);

  useEffect(() => {
    if (date === null) {
      setCurrentDate(new Date());
    }
  }, [date]);

  if (date !== null) {
    const parsed = parseDate(date);
    if (!parsed) {
      return null;
    }
    return (
      <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: '0.25rem 0 0 0' }}>
        {formatDate(parsed)}
      </p>
    );
  }

  if (!currentDate) {
    return null;
  }

  return (
    <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: '0.25rem 0 0 0' }}>
      {formatDate(currentDate)}
    </p>
  );
}
