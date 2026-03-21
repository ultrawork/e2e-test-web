import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface CategoryItem {
  id: string;
  name: string;
  color: string;
  createdAt: string;
}

interface NoteItem {
  id: string;
  title: string;
  content: string;
  categories: CategoryItem[];
  createdAt: string;
  updatedAt: string;
}

interface StoreShape {
  categories: CategoryItem[];
  notes: NoteItem[];
}

function getStore(): StoreShape {
  const g = globalThis as unknown as { __app_store?: StoreShape };
  if (!g.__app_store) {
    g.__app_store = { categories: [], notes: [] };
  }
  return g.__app_store;
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const store = getStore();
  const note = store.notes.find((n) => n.id === id);
  if (!note) {
    return NextResponse.json({ message: 'Note not found' }, { status: 404 });
  }
  return NextResponse.json(note);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const store = getStore();
    const index = store.notes.findIndex((n) => n.id === id);
    if (index === -1) {
      return NextResponse.json({ message: 'Note not found' }, { status: 404 });
    }
    const body = await request.json();
    if (body.title !== undefined) store.notes[index].title = body.title;
    if (body.content !== undefined) store.notes[index].content = body.content;
    if (body.categoryIds !== undefined) {
      store.notes[index].categories = body.categoryIds
        .map((cid: string) => store.categories.find((c) => c.id === cid))
        .filter(Boolean);
    }
    // Ensure updatedAt is always different from the previous value
    const now = new Date();
    const newUpdatedAt = now.toISOString();
    if (store.notes[index].updatedAt === newUpdatedAt) {
      now.setMilliseconds(now.getMilliseconds() + 1);
    }
    store.notes[index].updatedAt = now.toISOString();
    return NextResponse.json(store.notes[index]);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const store = getStore();
  const index = store.notes.findIndex((n) => n.id === id);
  if (index === -1) {
    return NextResponse.json({ message: 'Note not found' }, { status: 404 });
  }
  store.notes.splice(index, 1);
  return new NextResponse(null, { status: 204 });
}
