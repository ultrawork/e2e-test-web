import { NextRequest, NextResponse } from 'next/server';
import { notes, categories } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const note = notes.find((n) => n.id === id);
  if (!note) {
    return NextResponse.json({ message: 'Note not found' }, { status: 404 });
  }
  return NextResponse.json(note);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const index = notes.findIndex((n) => n.id === id);
    if (index === -1) {
      return NextResponse.json({ message: 'Note not found' }, { status: 404 });
    }
    const body = await request.json();
    if (body.title !== undefined) notes[index].title = body.title;
    if (body.content !== undefined) notes[index].content = body.content;
    if (body.categoryIds !== undefined) {
      notes[index].categories = body.categoryIds
        .map((cid: string) => categories.find((c) => c.id === cid))
        .filter(Boolean);
    }
    // Ensure updatedAt is always different from the previous value
    const now = new Date();
    const newUpdatedAt = now.toISOString();
    if (notes[index].updatedAt === newUpdatedAt) {
      now.setMilliseconds(now.getMilliseconds() + 1);
    }
    notes[index].updatedAt = now.toISOString();
    return NextResponse.json(notes[index]);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const index = notes.findIndex((n) => n.id === id);
  if (index === -1) {
    return NextResponse.json({ message: 'Note not found' }, { status: 404 });
  }
  notes.splice(index, 1);
  return new NextResponse(null, { status: 204 });
}
