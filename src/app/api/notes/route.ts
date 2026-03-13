import { NextRequest, NextResponse } from 'next/server';
import { extractUserId } from '@/lib/auth';
import { createNote, getNotesByUser } from '@/lib/store';

export async function GET(request: NextRequest) {
  const userId = extractUserId(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const notes = getNotesByUser(userId);
  return NextResponse.json(notes.map(({ userId: _uid, ...rest }) => rest));
}

export async function POST(request: NextRequest) {
  const userId = extractUserId(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { title, content, category } = body;

  const note = createNote(userId, title, content, category);
  const { userId: _uid, ...noteData } = note;
  return NextResponse.json(noteData, { status: 201 });
}
