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

const g = globalThis as any;
if (!g.__noteapp_store) {
  g.__noteapp_store = { users: [], notes: [], tokens: {}, uc: 1, nc: 1 };
}
const store: AppStore = g.__noteapp_store;

export function findUserByEmail(email: string): User | undefined {
  return store.users.find((u) => u.email === email);
}

export function createUser(email: string, password: string): User {
  const user: User = { id: String(store.uc++), email, password };
  store.users.push(user);
  return user;
}

export function generateToken(userId: string): string {
  const token = 'tok_' + userId + '_' + Date.now() + '_' + Math.random().toString(36).slice(2);
  store.tokens[token] = userId;
  return token;
}

export function getUserIdFromToken(token: string): string | null {
  return store.tokens[token] || null;
}

export function createNote(userId: string, title: string, content: string, category?: string): Note {
  const note: Note = {
    id: String(store.nc++),
    title,
    content,
    category,
    createdAt: new Date().toISOString(),
    userId,
  };
  store.notes.push(note);
  return note;
}

export function getNotesByUser(userId: string): Note[] {
  return store.notes.filter((n) => n.userId === userId);
}

export function getNoteById(id: string): Note | undefined {
  return store.notes.find((n) => n.id === id);
}

export function updateNote(id: string, data: { title?: string; content?: string }): Note | null {
  const note = getNoteById(id);
  if (!note) return null;
  if (data.title !== undefined) note.title = data.title;
  if (data.content !== undefined) note.content = data.content;
  return note;
}

export function deleteNote(id: string): boolean {
  const idx = store.notes.findIndex((n) => n.id === id);
  if (idx === -1) return false;
  store.notes.splice(idx, 1);
  return true;
}
