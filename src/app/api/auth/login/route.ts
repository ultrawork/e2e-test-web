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

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const s = getStore();
    let user = null;
    for (let i = 0; i < s.users.length; i++) {
      if (s.users[i].email === email) {
        user = s.users[i];
        break;
      }
    }

    if (!user || user.password !== password) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const token = 'tok_' + user.id + '_' + Date.now() + '_' + Math.random().toString(36).slice(2);
    s.tokens[token] = user.id;
    return NextResponse.json({ accessToken: token });
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }
}
