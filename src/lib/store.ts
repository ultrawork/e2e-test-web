// In-memory store for users and notes

export interface User {
  id: string;
  email: string;
  password: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  category?: string;
  createdAt: string;
  userId: string;
}

const users: User[] = [];
const notes: Note[] = [];
const tokens: Map<string, string> = new Map(); // token -> userId

let userIdCounter = 1;
let noteIdCounter = 1;

export function findUserByEmail(email: string): User | undefined {
  return users.find((u) => u.email === email);
}

export function createUser(email: string, password: string): User {
  const user: User = { id: String(userIdCounter++), email, password };
  users.push(user);
  return user;
}

export function generateToken(userId: string): string {
  const token = `tok_${userId}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  tokens.set(token, userId);
  return token;
}

export function getUserIdFromToken(token: string): string | null {
  return tokens.get(token) ?? null;
}

export function createNote(userId: string, title: string, content: string, category?: string): Note {
  const note: Note = {
    id: String(noteIdCounter++),
    title,
    content,
    category,
    createdAt: new Date().toISOString(),
    userId,
  };
  notes.push(note);
  return note;
}

export function getNotesByUser(userId: string): Note[] {
  return notes.filter((n) => n.userId === userId);
}

export function getNoteById(id: string): Note | undefined {
  return notes.find((n) => n.id === id);
}

export function updateNote(id: string, data: { title?: string; content?: string }): Note | null {
  const note = notes.find((n) => n.id === id);
  if (!note) return null;
  if (data.title !== undefined) note.title = data.title;
  if (data.content !== undefined) note.content = data.content;
  return note;
}

export function deleteNote(id: string): boolean {
  const idx = notes.findIndex((n) => n.id === id);
  if (idx === -1) return false;
  notes.splice(idx, 1);
  return true;
}
