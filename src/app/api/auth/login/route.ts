import { NextRequest, NextResponse } from 'next/server';
import { findUserByEmail, generateToken } from '@/lib/store';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { email, password } = body;

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
  }

  const user = findUserByEmail(email);
  if (!user || user.password !== password) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const accessToken = generateToken(user.id);
  return NextResponse.json({ accessToken });
}
