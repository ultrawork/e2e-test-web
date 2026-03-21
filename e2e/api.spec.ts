import { test, expect } from '@playwright/test';

const apiUrl = process.env.API_URL || process.env.BASE_URL || 'http://localhost:4000';

/** Helper to create a category and return its data. */
async function createCategory(request: any, name: string, color: string) {
  const res = await request.post(`${apiUrl}/api/categories`, {
    data: { name, color },
  });
  expect(res.status()).toBeGreaterThanOrEqual(200);
  expect(res.status()).toBeLessThan(300);
  return res.json();
}

/** Helper to create a note and return its data. */
async function createNote(request: any, title: string, content: string, categoryIds: string[]) {
  const res = await request.post(`${apiUrl}/api/notes`, {
    data: { title, content, categoryIds },
  });
  expect(res.status()).toBeGreaterThanOrEqual(200);
  expect(res.status()).toBeLessThan(300);
  return res.json();
}

test.describe('Categories API', () => {
  test('SC-006: Create category and get list', async ({ request }) => {
    const created = await createCategory(request, 'Работа', '#FF5733');

    expect(created).toHaveProperty('id');
    expect(typeof created.id).toBe('string');
    expect(created.name).toBe('Работа');
    expect(created.color).toBe('#FF5733');
    expect(created).toHaveProperty('createdAt');

    const listRes = await request.get(`${apiUrl}/api/categories`);
    expect(listRes.ok()).toBeTruthy();
    const categories = await listRes.json();
    expect(Array.isArray(categories)).toBeTruthy();

    const found = categories.find((c: any) => c.id === created.id);
    expect(found).toBeTruthy();
    expect(found.name).toBe('Работа');
    expect(found.color).toBe('#FF5733');
  });

  test('SC-007: Update category partially', async ({ request }) => {
    const created = await createCategory(request, 'Работа', '#FF5733');

    const updateRes = await request.put(`${apiUrl}/api/categories/${created.id}`, {
      data: { name: 'Личное' },
    });
    expect(updateRes.ok()).toBeTruthy();
    const updated = await updateRes.json();

    expect(updated.name).toBe('Личное');
    expect(updated.color).toBe('#FF5733');
  });

  test('SC-008: Delete category', async ({ request }) => {
    const created = await createCategory(request, 'ToDelete', '#000000');

    const deleteRes = await request.delete(`${apiUrl}/api/categories/${created.id}`);
    expect(deleteRes.status()).toBeGreaterThanOrEqual(200);
    expect(deleteRes.status()).toBeLessThan(300);

    const listRes = await request.get(`${apiUrl}/api/categories`);
    const categories = await listRes.json();
    const found = categories.find((c: any) => c.id === created.id);
    expect(found).toBeUndefined();
  });
});

test.describe('Notes API', () => {
  test('SC-001: Create note and get list', async ({ request }) => {
    const category = await createCategory(request, 'TestCat', '#112233');

    const created = await createNote(request, 'Тестовая заметка', 'Содержимое заметки', [category.id]);

    expect(created).toHaveProperty('id');
    expect(typeof created.id).toBe('string');
    expect(created.title).toBe('Тестовая заметка');
    expect(created.content).toBe('Содержимое заметки');
    expect(Array.isArray(created.categories)).toBeTruthy();
    expect(created).toHaveProperty('createdAt');
    expect(created).toHaveProperty('updatedAt');

    const listRes = await request.get(`${apiUrl}/api/notes`);
    expect(listRes.ok()).toBeTruthy();
    const notes = await listRes.json();
    expect(Array.isArray(notes)).toBeTruthy();

    const found = notes.find((n: any) => n.id === created.id);
    expect(found).toBeTruthy();
    expect(found.title).toBe('Тестовая заметка');
  });

  test('SC-002: Update note partially', async ({ request }) => {
    const category = await createCategory(request, 'UpdCat', '#223344');
    const created = await createNote(request, 'Original title', 'Original content', [category.id]);

    const updateRes = await request.put(`${apiUrl}/api/notes/${created.id}`, {
      data: { title: 'Обновлённый заголовок' },
    });
    expect(updateRes.ok()).toBeTruthy();
    const updated = await updateRes.json();

    expect(updated.title).toBe('Обновлённый заголовок');
    expect(updated.content).toBe('Original content');
    expect(updated.updatedAt).not.toBe(created.updatedAt);
  });

  test('SC-003: Delete note', async ({ request }) => {
    const category = await createCategory(request, 'DelCat', '#334455');
    const created = await createNote(request, 'ToDelete', 'content', [category.id]);

    const deleteRes = await request.delete(`${apiUrl}/api/notes/${created.id}`);
    expect(deleteRes.status()).toBeGreaterThanOrEqual(200);
    expect(deleteRes.status()).toBeLessThan(300);

    const listRes = await request.get(`${apiUrl}/api/notes`);
    const notes = await listRes.json();
    const found = notes.find((n: any) => n.id === created.id);
    expect(found).toBeUndefined();
  });

  test('SC-004: Filter notes by category', async ({ request }) => {
    const cat1 = await createCategory(request, 'Работа', '#FF0000');
    const cat2 = await createCategory(request, 'Личное', '#00FF00');

    const note1 = await createNote(request, 'Work note', 'work content', [cat1.id]);
    const note2 = await createNote(request, 'Personal note', 'personal content', [cat2.id]);

    const res1 = await request.get(`${apiUrl}/api/notes?category=${cat1.id}`);
    expect(res1.ok()).toBeTruthy();
    const filtered1 = await res1.json();
    expect(filtered1.some((n: any) => n.id === note1.id)).toBeTruthy();
    expect(filtered1.some((n: any) => n.id === note2.id)).toBeFalsy();

    const res2 = await request.get(`${apiUrl}/api/notes?category=${cat2.id}`);
    expect(res2.ok()).toBeTruthy();
    const filtered2 = await res2.json();
    expect(filtered2.some((n: any) => n.id === note2.id)).toBeTruthy();
    expect(filtered2.some((n: any) => n.id === note1.id)).toBeFalsy();

    const resAll = await request.get(`${apiUrl}/api/notes`);
    const allNotes = await resAll.json();
    expect(allNotes.some((n: any) => n.id === note1.id)).toBeTruthy();
    expect(allNotes.some((n: any) => n.id === note2.id)).toBeTruthy();
  });

  test('SC-005: Error handling for nonexistent note', async ({ request }) => {
    const getRes = await request.get(`${apiUrl}/api/notes/nonexistent-id-12345`);
    expect(getRes.status()).toBe(404);

    const putRes = await request.put(`${apiUrl}/api/notes/nonexistent-id-12345`, {
      data: { title: 'test' },
    });
    expect(putRes.status()).toBe(404);

    const deleteRes = await request.delete(`${apiUrl}/api/notes/nonexistent-id-12345`);
    expect(deleteRes.status()).toBe(404);
  });
});
