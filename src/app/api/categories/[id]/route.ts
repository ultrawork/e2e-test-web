import { NextRequest, NextResponse } from 'next/server';
import { categories } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const category = categories.find((c) => c.id === id);
  if (!category) {
    return NextResponse.json({ message: 'Category not found' }, { status: 404 });
  }
  return NextResponse.json(category);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const index = categories.findIndex((c) => c.id === id);
  if (index === -1) {
    return NextResponse.json({ message: 'Category not found' }, { status: 404 });
  }
  const body = await request.json();
  if (body.name !== undefined) categories[index].name = body.name;
  if (body.color !== undefined) categories[index].color = body.color;
  return NextResponse.json(categories[index]);
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const index = categories.findIndex((c) => c.id === id);
  if (index === -1) {
    return NextResponse.json({ message: 'Category not found' }, { status: 404 });
  }
  categories.splice(index, 1);
  return new NextResponse(null, { status: 204 });
}
