import { NextRequest, NextResponse } from 'next/server';
import { categories } from '../store';
import { randomUUID } from 'crypto';

export async function GET() {
  return NextResponse.json(categories);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const category = {
    id: randomUUID(),
    name: body.name,
    color: body.color,
    createdAt: new Date().toISOString(),
  };
  categories.push(category);
  return NextResponse.json(category, { status: 201 });
}
