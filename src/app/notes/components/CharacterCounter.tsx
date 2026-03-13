'use client';

import React from 'react';

interface CharacterCounterProps {
  count: number;
}

export default function CharacterCounter({ count }: CharacterCounterProps) {
  return (
    <span
      role="status"
      aria-live="polite"
      style={{ color: 'gray', fontSize: '0.75rem' }}
    >
      {count} символов
    </span>
  );
}
