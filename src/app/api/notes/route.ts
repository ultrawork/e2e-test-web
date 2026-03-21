import { NextRequest, NextResponse } from 'next/server';
import { notes, categories } from '../store';

export async function GET(request: NextRequest) {
  const categoryId = request.nextUrl.searchParams.get('category');
  if (categoryId) {
    const filtered = notes.filter((n) =>
      n.categories.some((c) => c.id === categoryId)
    );
    return NextResponse.json(filtered);
  }
  return NextResponse.json(notes);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const now = new Date().toISOString();
  const noteCats = (body.categoryIds || [])
    .map((cid: string) => categories.find((c) => c.id === cid))
    .filter(Boolean);
  const note = {
    id: crypto.randomUUID(),
    title: body.title,
    content: body.content,
    categories: noteCats,
    createdAt: now,
    updatedAt: now,
  };
  notes.push(note);
  return NextResponse.json(note, { status: 201 });
}
