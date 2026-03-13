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

export async function GET(request: Request) {
  const userId = extractUserId(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const s = getStore();
  const result: any[] = [];
  for (let i = 0; i < s.notes.length; i++) {
    const n = s.notes[i];
    if (n.userId === userId) {
      result.push({ id: n.id, title: n.title, content: n.content, category: n.category, createdAt: n.createdAt });
    }
  }
  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const userId = extractUserId(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const s = getStore();
    const note = {
      id: String(s.nc++),
      title: body.title,
      content: body.content,
      category: body.category,
      createdAt: new Date().toISOString(),
      userId: userId,
    };
    s.notes.push(note);
    return NextResponse.json(
      { id: note.id, title: note.title, content: note.content, category: note.category, createdAt: note.createdAt },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }
}
