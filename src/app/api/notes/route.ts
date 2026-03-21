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

function generateId(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
  } catch {
    // fallback below
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export async function GET(request: NextRequest) {
  const store = getStore();
  const url = new URL(request.url);
  const categoryId = url.searchParams.get('category');
  if (categoryId) {
    const filtered = store.notes.filter((n) =>
      n.categories.some((c) => c.id === categoryId)
    );
    return NextResponse.json(filtered);
  }
  return NextResponse.json(store.notes);
}

export async function POST(request: NextRequest) {
  try {
    const store = getStore();
    const body = await request.json();
    const now = new Date().toISOString();
    const noteCats = (body.categoryIds || [])
      .map((cid: string) => store.categories.find((c) => c.id === cid))
      .filter(Boolean);
    const note: NoteItem = {
      id: generateId(),
      title: body.title,
      content: body.content,
      categories: noteCats as CategoryItem[],
      createdAt: now,
      updatedAt: now,
    };
    store.notes.push(note);
    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    );
  }
}
