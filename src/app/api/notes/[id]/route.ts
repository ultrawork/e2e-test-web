import { NextResponse } from 'next/server';

/* eslint-disable @typescript-eslint/no-explicit-any */
function getStore(): any {
  const g = globalThis as any;
  if (!g.__noteapp_store) {
    g.__noteapp_store = { users: [], notes: [], tokens: {}, uc: 1, nc: 1 };
  }
  return g.__noteapp_store;
}

function extractUserId(request: Request): string | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return null;
  if (!authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  const s = getStore();
  return s.tokens[token] || null;
}

function findNote(id: string): any {
  const s = getStore();
  for (let i = 0; i < s.notes.length; i++) {
    if (s.notes[i].id === id) return s.notes[i];
  }
  return null;
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await context.params;
  const id = resolvedParams.id;

  const userId = extractUserId(request);
  const note = findNote(id);

  if (!note) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  if (userId && note.userId !== userId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({
    id: note.id,
    title: note.title,
    content: note.content,
    category: note.category,
    createdAt: note.createdAt,
  });
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const userId = extractUserId(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const resolvedParams = await context.params;
  const id = resolvedParams.id;
  const note = findNote(id);
  if (!note || note.userId !== userId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  try {
    const body = await request.json();
    if (body.title !== undefined) note.title = body.title;
    if (body.content !== undefined) note.content = body.content;
    return NextResponse.json({
      id: note.id,
      title: note.title,
      content: note.content,
      category: note.category,
      createdAt: note.createdAt,
    });
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const userId = extractUserId(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const resolvedParams = await context.params;
  const id = resolvedParams.id;
  const note = findNote(id);
  if (!note || note.userId !== userId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const s = getStore();
  for (let i = 0; i < s.notes.length; i++) {
    if (s.notes[i].id === id) {
      s.notes.splice(i, 1);
      break;
    }
  }
  return NextResponse.json({ success: true });
}
