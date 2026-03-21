import { NextRequest, NextResponse } from 'next/server';
import { categories, generateId } from '../../../lib/store';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(_request: NextRequest) {
  return NextResponse.json(categories);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const category = {
      id: generateId(),
      name: body.name,
      color: body.color,
      createdAt: new Date().toISOString(),
    };
    categories.push(category);
    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    );
  }
}
