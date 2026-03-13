import { NextResponse } from 'next/server';
import { getUserIdFromToken, getNoteById, updateNote, deleteNote } from '@/lib/store';

function extractUserId(request: Request): string | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  return getUserIdFromToken(token);
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const note = getNoteById(id);
  if (!note) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json({
    id: note.id, title: note.title, content: note.content, category: note.category, createdAt: note.createdAt,
  });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = extractUserId(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id } = await params;
  const note = getNoteById(id);
  if (!note || note.userId !== userId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  try {
    const body = await request.json();
    const { title, content } = body;
    const updated = updateNote(id, { title, content });
    if (!updated) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({
      id: updated.id, title: updated.title, content: updated.content, category: updated.category, createdAt: updated.createdAt,
    });
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = extractUserId(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id } = await params;
  const note = getNoteById(id);
  if (!note || note.userId !== userId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  deleteNote(id);
  return NextResponse.json({ success: true });
}
