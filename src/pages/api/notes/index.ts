import type { NextApiRequest, NextApiResponse } from 'next';
import { getUserIdFromToken, getNotesByUser, createNote } from '../../../lib/store';

function extractUserId(req: NextApiRequest): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  return getUserIdFromToken(token);
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const userId = extractUserId(req);

  if (req.method === 'GET') {
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const notes = getNotesByUser(userId);
    return res.status(200).json(notes.map((n) => ({
      id: n.id, title: n.title, content: n.content, category: n.category, createdAt: n.createdAt,
    })));
  }

  if (req.method === 'POST') {
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    try {
      const { title, content, category } = req.body;
      const note = createNote(userId, title, content, category);
      return res.status(201).json({
        id: note.id, title: note.title, content: note.content, category: note.category, createdAt: note.createdAt,
      });
    } catch {
      return res.status(400).json({ error: 'Bad request' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
