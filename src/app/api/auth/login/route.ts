import { NextResponse } from 'next/server';
import { findUserByEmail, generateToken } from '@/lib/store';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const user = findUserByEmail(email);
    if (!user || user.password !== password) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const token = generateToken(user.id);
    return NextResponse.json({ accessToken: token });
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }
}
