import { NextResponse } from 'next/server';
import { getUserIdFromToken, createNote, getNotesByUser } from '../../../lib/store';

function extractUserId(request: Request): string | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return null;
  if (!authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  return getUserIdFromToken(token);
}

export async function GET(request: Request) {
  const userId = extractUserId(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const notes = getNotesByUser(userId);
  const result = notes.map(function (n) {
    return { id: n.id, title: n.title, content: n.content, category: n.category, createdAt: n.createdAt };
  });
  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const userId = extractUserId(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const note = createNote(userId, body.title, body.content, body.category);
    return NextResponse.json(
      { id: note.id, title: note.title, content: note.content, category: note.category, createdAt: note.createdAt },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }
}
