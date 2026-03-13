import { test, expect } from '@playwright/test';

const apiUrl = process.env.API_URL || process.env.BASE_URL || 'http://localhost:3000';

async function registerAndLogin(request: any): Promise<string> {
  const email = `notes_${Date.now()}@example.com`;
  await request.post(`${apiUrl}/api/auth/register`, {
    data: { email, password: 'SecurePass123' },
  });
  const loginResponse = await request.post(`${apiUrl}/api/auth/login`, {
    data: { email, password: 'SecurePass123' },
  });
  const body = await loginResponse.json();
  return body.accessToken;
}

test.describe('API Notes', () => {
  test('SC-006: should create note with createdAt', async ({ request }) => {
    const token = await registerAndLogin(request);
    const beforeTime = new Date();

    const response = await request.post(`${apiUrl}/api/notes`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { title: 'Тестовая заметка', content: 'Содержимое тестовой заметки', category: 'PERSONAL' },
    });
    expect(response.status()).toBe(201);
    const note = await response.json();
    expect(note).toHaveProperty('id');
    expect(note).toHaveProperty('title', 'Тестовая заметка');
    expect(note).toHaveProperty('createdAt');

    const createdAt = new Date(note.createdAt);
    const diffMs = Math.abs(createdAt.getTime() - beforeTime.getTime());
    expect(diffMs).toBeLessThan(2 * 60 * 1000); // within 2 minutes
  });

  test('SC-007: should list notes', async ({ request }) => {
    const token = await registerAndLogin(request);

    // Create 2 notes
    await request.post(`${apiUrl}/api/notes`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { title: 'Note 1', content: 'Content 1' },
    });
    await request.post(`${apiUrl}/api/notes`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { title: 'Note 2', content: 'Content 2' },
    });

    const response = await request.get(`${apiUrl}/api/notes`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(response.status()).toBe(200);
    const notes = await response.json();
    expect(Array.isArray(notes)).toBe(true);
    expect(notes.length).toBeGreaterThanOrEqual(2);
    expect(notes[0]).toHaveProperty('id');
    expect(notes[0]).toHaveProperty('title');
    expect(notes[0]).toHaveProperty('createdAt');
  });

  test('SC-008: should preserve createdAt on update', async ({ request }) => {
    const token = await registerAndLogin(request);

    const createResp = await request.post(`${apiUrl}/api/notes`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { title: 'Original', content: 'Content' },
    });
    const created = await createResp.json();
    const originalCreatedAt = created.createdAt;

    // Update the note
    const updateResp = await request.put(`${apiUrl}/api/notes/${created.id}`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { title: 'Обновлённый заголовок', content: 'Обновлённое содержимое' },
    });
    expect(updateResp.status()).toBe(200);

    // Re-fetch
    const getResp = await request.get(`${apiUrl}/api/notes/${created.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const updated = await getResp.json();
    expect(updated.createdAt).toBe(originalCreatedAt);
  });

  test('SC-009: should delete a note', async ({ request }) => {
    const token = await registerAndLogin(request);

    const createResp = await request.post(`${apiUrl}/api/notes`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { title: 'To Delete', content: 'Content' },
    });
    const note = await createResp.json();

    const deleteResp = await request.delete(`${apiUrl}/api/notes/${note.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect([200, 204]).toContain(deleteResp.status());

    const getResp = await request.get(`${apiUrl}/api/notes/${note.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(getResp.status()).toBe(404);
  });

  test('SC-010: should reject unauthenticated access', async ({ request }) => {
    const getResp = await request.get(`${apiUrl}/api/notes`);
    expect(getResp.status()).toBe(401);

    const postResp = await request.post(`${apiUrl}/api/notes`, {
      data: { title: 'Unauthorized', content: 'Text' },
    });
    expect(postResp.status()).toBe(401);
  });
});
