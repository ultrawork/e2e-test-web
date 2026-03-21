import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface StoreShape {
  categories: Array<{ id: string; name: string; color: string; createdAt: string }>;
  notes: Array<unknown>;
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

export async function GET(_request: NextRequest) {
  const store = getStore();
  return NextResponse.json(store.categories);
}

export async function POST(request: NextRequest) {
  try {
    const store = getStore();
    const body = await request.json();
    const category = {
      id: generateId(),
      name: body.name,
      color: body.color,
      createdAt: new Date().toISOString(),
    };
    store.categories.push(category);
    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    );
  }
}
