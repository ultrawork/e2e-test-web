import { NextResponse } from 'next/server';

/* eslint-disable @typescript-eslint/no-explicit-any */
function getStore(): any {
  const g = globalThis as any;
  if (!g.__noteapp_store) {
    g.__noteapp_store = { users: [], notes: [], tokens: {}, uc: 1, nc: 1 };
  }
  return g.__noteapp_store;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = body.email;
    const password = body.password;

    if (!email || typeof email !== 'string' || email.trim() === '') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    if (!password || typeof password !== 'string') {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 });
    }

    const s = getStore();
    for (let i = 0; i < s.users.length; i++) {
      if (s.users[i].email === email) {
        return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
      }
    }

    const user = { id: String(s.uc++), email: email, password: password };
    s.users.push(user);
    return NextResponse.json({ id: user.id, email: user.email }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }
}
