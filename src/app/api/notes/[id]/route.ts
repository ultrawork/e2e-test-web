import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'e2e-test-secret-key-ultrawork';

interface StoredNote {
  id: number;
  title: string;
  userId: string;
}

// Import the shared store — re-declared here for module scope.
// Next.js API routes share the same process, so we use a shared reference.
// We import indirectly by referencing the parent module's store via globalThis.
declare global {
  // eslint-disable-next-line no-var
  var __notesStore: StoredNote[] | undefined;
}

function getStore(): StoredNote[] {
  if (!globalThis.__notesStore) {
    globalThis.__notesStore = [];
  }
  return globalThis.__notesStore;
}

/** Extract and verify JWT from Authorization header. */
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

/** DELETE /api/notes/:id — delete a note by id for the authenticated user. */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const userId = authenticate(req);
  if (!userId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { id: idParam } = await params;
  const noteId = parseInt(idParam, 10);
  if (isNaN(noteId)) {
    return NextResponse.json({ message: 'Invalid note id' }, { status: 400 });
  }

  const store = getStore();
  const idx = store.findIndex((n) => n.id === noteId && n.userId === userId);
  if (idx === -1) {
    return NextResponse.json({ message: 'Note not found' }, { status: 404 });
  }

  store.splice(idx, 1);
  return new NextResponse(null, { status: 204 });
}
