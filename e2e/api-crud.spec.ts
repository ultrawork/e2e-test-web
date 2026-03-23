import { test, expect } from '@playwright/test';

const apiUrl = process.env.API_URL || 'http://localhost:4000';

/** Helper: create a note via API, return its data. */
async function createNoteViaApi(
  request: import('@playwright/test').APIRequestContext,
  title: string,
  content: string
) {
  const res = await request.post(`${apiUrl}/api/notes`, {
    data: { title, content },
    headers: { 'Content-Type': 'application/json' },
  });
  expect(res.status()).toBe(201);
  return res.json();
}

/** Helper: delete all notes so each test starts clean. */
async function deleteAllNotes(request: import('@playwright/test').APIRequestContext) {
  const res = await request.get(`${apiUrl}/api/notes`);
  if (!res.ok()) return;
  const notes = await res.json();
  for (const note of notes) {
    await request.delete(`${apiUrl}/api/notes/${note.id}`);
  }
}

test.describe('Backend API — CRUD and CORS', () => {
  test.beforeEach(async ({ request }) => {
    await deleteAllNotes(request);
  });

  test.afterEach(async ({ request }) => {
    await deleteAllNotes(request);
  });

  test('SC-001: CORS — allowed origin receives correct headers', async ({ request }) => {
    const res = await request.get(`${apiUrl}/api/notes`, {
      headers: {
        Origin: 'http://localhost:3001',
      },
    });
    expect(res.ok()).toBeTruthy();
    const corsHeader = res.headers()['access-control-allow-origin'];
    expect(corsHeader).toBeTruthy();
  });

  test('SC-002: CORS — disallowed origin does not get CORS headers', async ({ request }) => {
    const res = await request.get(`${apiUrl}/api/notes`, {
      headers: {
        Origin: 'http://evil.com',
      },
    });
    // The response body is still returned (CORS is a client-side check)
    // but the Access-Control-Allow-Origin header should NOT match http://evil.com
    const corsHeader = res.headers()['access-control-allow-origin'];
    if (corsHeader) {
      expect(corsHeader).not.toBe('http://evil.com');
    }
  });

  test('SC-003: CRUD — full note lifecycle (create, read, update, delete)', async ({
    request,
  }) => {
    // 1. List should be empty
    const listEmpty = await request.get(`${apiUrl}/api/notes`);
    expect(listEmpty.ok()).toBeTruthy();
    const emptyNotes = await listEmpty.json();
    expect(emptyNotes).toEqual([]);

    // 2. Create a note
    const createRes = await request.post(`${apiUrl}/api/notes`, {
      data: { title: 'Test Note', content: 'Test content' },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(createRes.status()).toBe(201);
    const created = await createRes.json();
    expect(created.id).toBeTruthy();
    expect(created.title).toBe('Test Note');
    expect(created.content).toBe('Test content');

    // 3. List should have 1 note
    const listOne = await request.get(`${apiUrl}/api/notes`);
    const oneNote = await listOne.json();
    expect(oneNote).toHaveLength(1);
    expect(oneNote[0].id).toBe(created.id);

    // 4. Get note by id
    const getRes = await request.get(`${apiUrl}/api/notes/${created.id}`);
    expect(getRes.ok()).toBeTruthy();
    const fetched = await getRes.json();
    expect(fetched.title).toBe('Test Note');

    // 5. Update the note
    const updateRes = await request.put(`${apiUrl}/api/notes/${created.id}`, {
      data: { title: 'Updated', content: 'Updated content' },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(updateRes.status()).toBe(200);
    const updated = await updateRes.json();
    expect(updated.title).toBe('Updated');

    // 6. Delete the note
    const deleteRes = await request.delete(`${apiUrl}/api/notes/${created.id}`);
    expect(deleteRes.status()).toBe(204);

    // 7. List should be empty again
    const listFinal = await request.get(`${apiUrl}/api/notes`);
    const finalNotes = await listFinal.json();
    expect(finalNotes).toEqual([]);
  });

  test('SC-004: Validation — creating note without required fields returns 400', async ({
    request,
  }) => {
    // Empty object
    const res1 = await request.post(`${apiUrl}/api/notes`, {
      data: {},
      headers: { 'Content-Type': 'application/json' },
    });
    expect(res1.status()).toBe(400);

    // Only title
    const res2 = await request.post(`${apiUrl}/api/notes`, {
      data: { title: 'Only title' },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(res2.status()).toBe(400);

    // Only content
    const res3 = await request.post(`${apiUrl}/api/notes`, {
      data: { content: 'Only content' },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(res3.status()).toBe(400);

    // Delete non-existent note
    const res4 = await request.delete(`${apiUrl}/api/notes/non-existent-id`);
    expect(res4.status()).toBe(404);
  });
});
