import { NextRequest, NextResponse } from 'next/server';
import { extractUserId } from '@/lib/auth';
import { getNoteById, updateNote, deleteNote } from '@/lib/store';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = extractUserId(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const note = getNoteById(id);
  if (!note || note.userId !== userId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const { userId: _uid, ...noteData } = note;
  return NextResponse.json(noteData);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = extractUserId(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const note = getNoteById(id);
  if (!note || note.userId !== userId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const body = await request.json();
  const updated = updateNote(id, body);
  if (!updated) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const { userId: _uid, ...noteData } = updated;
  return NextResponse.json(noteData);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = extractUserId(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const note = getNoteById(id);
  if (!note || note.userId !== userId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  deleteNote(id);
  return NextResponse.json({ success: true });
}
