import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface CategoryItem {
  id: string;
  name: string;
  color: string;
  createdAt: string;
}

interface StoreShape {
  categories: CategoryItem[];
  notes: Array<unknown>;
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
  const category = store.categories.find((c) => c.id === id);
  if (!category) {
    return NextResponse.json({ message: 'Category not found' }, { status: 404 });
  }
  return NextResponse.json(category);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const store = getStore();
  const index = store.categories.findIndex((c) => c.id === id);
  if (index === -1) {
    return NextResponse.json({ message: 'Category not found' }, { status: 404 });
  }
  const body = await request.json();
  if (body.name !== undefined) store.categories[index].name = body.name;
  if (body.color !== undefined) store.categories[index].color = body.color;
  return NextResponse.json(store.categories[index]);
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const store = getStore();
  const index = store.categories.findIndex((c) => c.id === id);
  if (index === -1) {
    return NextResponse.json({ message: 'Category not found' }, { status: 404 });
  }
  store.categories.splice(index, 1);
  return new NextResponse(null, { status: 204 });
}
