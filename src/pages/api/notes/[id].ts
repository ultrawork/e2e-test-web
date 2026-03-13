import type { NextApiRequest, NextApiResponse } from 'next';
import { getUserIdFromToken, getNoteById, updateNote, deleteNote } from '../../../lib/store';

function extractUserId(req: NextApiRequest): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  return getUserIdFromToken(token);
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const id = req.query.id as string;

  if (req.method === 'GET') {
    const note = getNoteById(id);
    if (!note) {
      return res.status(404).json({ error: 'Not found' });
    }
    return res.status(200).json({
      id: note.id, title: note.title, content: note.content, category: note.category, createdAt: note.createdAt,
    });
  }

  const userId = extractUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'PUT') {
    const note = getNoteById(id);
    if (!note || note.userId !== userId) {
      return res.status(404).json({ error: 'Not found' });
    }
    const { title, content } = req.body;
    const updated = updateNote(id, { title, content });
    if (!updated) {
      return res.status(404).json({ error: 'Not found' });
    }
    return res.status(200).json({
      id: updated.id, title: updated.title, content: updated.content, category: updated.category, createdAt: updated.createdAt,
    });
  }

  if (req.method === 'DELETE') {
    const note = getNoteById(id);
    if (!note || note.userId !== userId) {
      return res.status(404).json({ error: 'Not found' });
    }
    deleteNote(id);
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
