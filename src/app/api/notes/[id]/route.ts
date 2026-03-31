import { NextRequest, NextResponse } from 'next/server';
import { authenticate, getStore } from '../_shared';

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
