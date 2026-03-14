import { test, expect } from '@playwright/test';

const apiUrl = process.env.API_URL || (process.env.BASE_URL || 'http://localhost:3000');

// SC-006: Health check — server availability
test('SC-006: should return 200 OK with status ok from health endpoint', async ({ request }) => {
  const response = await request.get(`${apiUrl}/health`);
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('application/json');
  const body = await response.json();
  expect(body).toEqual({ status: 'ok' });
});

// SC-007: CORS — cross-origin requests allowed
test('SC-007: should include CORS headers in OPTIONS response', async ({ request }) => {
  const response = await request.fetch(`${apiUrl}/health`, {
    method: 'OPTIONS',
    headers: {
      'Origin': 'http://localhost:3001',
    },
  });
  const headers = response.headers();
  expect(headers['access-control-allow-origin']).toBeDefined();
});
