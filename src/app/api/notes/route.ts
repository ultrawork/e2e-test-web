import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'e2e-test-secret-key-ultrawork';

interface StoredNote {
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
function getStore(): StoredNote[] {
  if (!globalThis.__notesStore) {
    globalThis.__notesStore = [];
  }
  return globalThis.__notesStore;
}

function getNextId(): number {
  if (!globalThis.__notesNextId) {
    globalThis.__notesNextId = 1;
  }
  return globalThis.__notesNextId++;
}

/** Extract and verify JWT from Authorization header. Returns user sub or null. */
function authenticate(req: NextRequest): string | null {
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

/** GET /api/notes — list notes for the authenticated user. */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const userId = authenticate(req);
  if (!userId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const store = getStore();
  const userNotes = store
    .filter((n) => n.userId === userId)
    .map(({ id, title }) => ({ id, title }));

  return NextResponse.json(userNotes);
}

/** POST /api/notes — create a note for the authenticated user. */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const userId = authenticate(req);
  if (!userId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const body = (await req.json()) as { title?: string };
  if (!body.title || typeof body.title !== 'string') {
    return NextResponse.json({ message: 'title is required' }, { status: 400 });
  }

  const store = getStore();
  const note: StoredNote = { id: getNextId(), title: body.title, userId };
  store.push(note);

  return NextResponse.json({ id: note.id, title: note.title }, { status: 201 });
}
