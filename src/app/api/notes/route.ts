import { NextRequest, NextResponse } from 'next/server';
import { authenticate, getStore, getNextId, type StoredNote } from './_shared';

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

  let body: { title?: string };
  try {
    body = (await req.json()) as { title?: string };
  } catch {
    return NextResponse.json({ message: 'Invalid JSON' }, { status: 400 });
  }
  if (!body.title || typeof body.title !== 'string') {
    return NextResponse.json({ message: 'title is required' }, { status: 400 });
  }

  const store = getStore();
  const note: StoredNote = { id: getNextId(), title: body.title, userId };
  store.push(note);

  return NextResponse.json({ id: note.id, title: note.title }, { status: 201 });
}
