import { test, expect } from '@playwright/test';
import jwt from 'jsonwebtoken';

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required for e2e tests');
}
const JWT_SECRET = process.env.JWT_SECRET;

function signToken(sub: string): string {
  return jwt.sign({ sub, email: `${sub}@e2e.test` }, JWT_SECRET, { expiresIn: '1h' });
}

test.describe('Notes API Endpoint Tests', () => {
  test('SC-03: GET /api/notes without JWT returns 401', async ({ request }) => {
    const apiUrl = process.env.API_URL || process.env.BASE_URL || 'http://localhost:4000';

    const response = await request.get(`${apiUrl}/api/notes`);

    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body).toHaveProperty('message', 'Unauthorized');
  });

  test('SC-03b: POST /api/notes without JWT returns 401', async ({ request }) => {
    const apiUrl = process.env.API_URL || process.env.BASE_URL || 'http://localhost:4000';

    const response = await request.post(`${apiUrl}/api/notes`, {
      headers: { 'Content-Type': 'application/json' },
      data: { title: 'Should not be created' },
    });

    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body).toHaveProperty('message', 'Unauthorized');
  });
});
