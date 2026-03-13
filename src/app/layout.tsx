import React from 'react';

export const metadata = { title: 'Notes App', description: 'Cross-platform notes application' };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (<html lang="en"><body>{children}</body></html>);
}
