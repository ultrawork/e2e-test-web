import { NextResponse } from 'next/server';
import { findUserByEmail, generateToken } from '../../../../lib/store';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = body.email;
    const password = body.password;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const user = findUserByEmail(email);
    if (!user || user.password !== password) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const accessToken = generateToken(user.id);
    return NextResponse.json({ accessToken: accessToken });
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }
}
