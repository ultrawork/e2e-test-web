import { render, screen } from '@testing-library/react';
import Home from '@/app/page';

jest.mock('next/link', () => {
  return function MockLink({ href, children }: { href: string; children: React.ReactNode }) {
    return <a href={href}>{children}</a>;
  };
});

describe('Home page', () => {
  test('SC-001: displays heading, welcome text, and link to notes', () => {
    render(<Home />);

    expect(screen.getByRole('heading', { level: 1, name: 'Notes App' })).toBeInTheDocument();
    expect(screen.getByText(/Welcome to the Notes App/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Go to Notes' })).toBeInTheDocument();
  });

  test('SC-002: link points to /notes', () => {
    render(<Home />);

    const link = screen.getByRole('link', { name: 'Go to Notes' });
    expect(link).toHaveAttribute('href', '/notes');
  });
});
