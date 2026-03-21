import { NextRequest, NextResponse } from 'next/server';
import { notes, categories, generateId } from '../store';

export const dynamic = 'force-dynamic';

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
  try {
    const body = await request.json();
    const now = new Date().toISOString();
    const noteCats = (body.categoryIds || [])
      .map((cid: string) => categories.find((c) => c.id === cid))
      .filter(Boolean);
    const note = {
      id: generateId(),
      title: body.title,
      content: body.content,
      categories: noteCats,
      createdAt: now,
      updatedAt: now,
    };
    notes.push(note);
    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    );
  }
}
