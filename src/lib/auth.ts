import { NextRequest } from 'next/server';
import { getUserIdFromToken } from './store';

export function extractUserId(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  return getUserIdFromToken(token);
}
