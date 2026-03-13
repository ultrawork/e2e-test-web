/* eslint-disable @typescript-eslint/no-explicit-any */

interface User {
  id: string;
  email: string;
  password: string;
}

interface Note {
  id: string;
  title: string;
  content: string;
  category?: string;
  createdAt: string;
  userId: string;
}

interface AppStore {
  users: User[];
  notes: Note[];
  tokens: Record<string, string>;
  uc: number;
  nc: number;
}

function getStore(): AppStore {
  const g = globalThis as any;
  if (!g._ns) {
    g._ns = { users: [], notes: [], tokens: {}, uc: 1, nc: 1 };
  }
  return g._ns as AppStore;
}

export function findUserByEmail(email: string): User | undefined {
  const s = getStore();
  for (let i = 0; i < s.users.length; i++) {
    if (s.users[i].email === email) return s.users[i];
  }
  return undefined;
}

export function createUser(email: string, password: string): User {
  const s = getStore();
  const user: User = { id: String(s.uc++), email: email, password: password };
  s.users.push(user);
  return user;
}

export function generateToken(userId: string): string {
  const s = getStore();
  const token = 'tok_' + userId + '_' + Date.now() + '_' + Math.random().toString(36).slice(2);
  s.tokens[token] = userId;
  return token;
}

export function getUserIdFromToken(token: string): string | null {
  const s = getStore();
  return s.tokens[token] || null;
}

export function createNote(userId: string, title: string, content: string, category?: string): Note {
  const s = getStore();
  const note: Note = {
    id: String(s.nc++),
    title: title,
    content: content,
    category: category,
    createdAt: new Date().toISOString(),
    userId: userId,
  };
  s.notes.push(note);
  return note;
}

export function getNotesByUser(userId: string): Note[] {
  const s = getStore();
  const result: Note[] = [];
  for (let i = 0; i < s.notes.length; i++) {
    if (s.notes[i].userId === userId) result.push(s.notes[i]);
  }
  return result;
}

export function getNoteById(id: string): Note | undefined {
  const s = getStore();
  for (let i = 0; i < s.notes.length; i++) {
    if (s.notes[i].id === id) return s.notes[i];
  }
  return undefined;
}

export function updateNote(id: string, data: { title?: string; content?: string }): Note | null {
  const note = getNoteById(id);
  if (!note) return null;
  if (data.title !== undefined) note.title = data.title;
  if (data.content !== undefined) note.content = data.content;
  return note;
}

export function deleteNote(id: string): boolean {
  const s = getStore();
  for (let i = 0; i < s.notes.length; i++) {
    if (s.notes[i].id === id) {
      s.notes.splice(i, 1);
      return true;
    }
  }
  return false;
}
