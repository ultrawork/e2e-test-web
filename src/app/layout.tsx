import React from 'react';
import type { ReactNode } from 'react';

export const metadata = { title: 'Notes App', description: 'Cross-platform notes application' };
export default function RootLayout({ children }: { children: ReactNode }): React.ReactElement {
  return (<html lang="en"><body>{children}</body></html>);
}
