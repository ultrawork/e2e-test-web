import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

const JWT_SECRET = process.env.JWT_SECRET;

export interface StoredNote {
  id: number;
  title: string;
  userId: string;
}

declare global {
  // eslint-disable-next-line no-var
  var __notesStore: StoredNote[] | undefined;
  // eslint-disable-next-line no-var
  var __notesNextId: number | undefined;
}

/** In-memory notes store shared via globalThis (per-process, resets on restart). */
export function getStore(): StoredNote[] {
  if (!globalThis.__notesStore) {
    globalThis.__notesStore = [];
  }
  return globalThis.__notesStore;
}

export function getNextId(): number {
  if (!globalThis.__notesNextId) {
    globalThis.__notesNextId = 1;
  }
  return globalThis.__notesNextId++;
}

/** Extract and verify JWT from Authorization header. Returns user sub or null. */
export function authenticate(req: NextRequest): string | null {
  const auth = req.headers.get('authorization');
  if (!auth || !auth.startsWith('Bearer ')) return null;
  const token = auth.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { sub?: string };
    return payload.sub ?? null;
  } catch {
    return null;
  }
}
