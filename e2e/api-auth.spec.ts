import { test, expect } from '@playwright/test';

const apiUrl = process.env.API_URL || process.env.BASE_URL || 'http://localhost:3000';

test.describe('API Auth', () => {
  test('SC-001: health check should return ok', async ({ request }) => {
    const response = await request.get(`${apiUrl}/health`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.status).toBe('ok');
  });

  test('SC-002: should register a new user', async ({ request }) => {
    const email = `testuser_${Date.now()}@example.com`;
    const response = await request.post(`${apiUrl}/api/auth/register`, {
      data: { email, password: 'SecurePass123' },
    });
    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body).toHaveProperty('id');
    expect(body).toHaveProperty('email', email);
    expect(body).not.toHaveProperty('password');
  });

  test('SC-003: should reject invalid registration', async ({ request }) => {
    // Empty email
    const emptyEmailResponse = await request.post(`${apiUrl}/api/auth/register`, {
      data: { email: '', password: 'SecurePass123' },
    });
    expect(emptyEmailResponse.status()).toBe(400);

    // Register a user first
    const dupEmail = `duplicate_${Date.now()}@example.com`;
    await request.post(`${apiUrl}/api/auth/register`, {
      data: { email: dupEmail, password: 'SecurePass123' },
    });

    // Duplicate email
    const dupResponse = await request.post(`${apiUrl}/api/auth/register`, {
      data: { email: dupEmail, password: 'SecurePass123' },
    });
    expect([400, 409]).toContain(dupResponse.status());
  });

  test('SC-004: should login and get token', async ({ request }) => {
    const email = `login_${Date.now()}@example.com`;
    await request.post(`${apiUrl}/api/auth/register`, {
      data: { email, password: 'SecurePass123' },
    });

    const response = await request.post(`${apiUrl}/api/auth/login`, {
      data: { email, password: 'SecurePass123' },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('accessToken');
  });

  test('SC-005: should reject invalid credentials', async ({ request }) => {
    const email = `login_bad_${Date.now()}@example.com`;
    await request.post(`${apiUrl}/api/auth/register`, {
      data: { email, password: 'SecurePass123' },
    });

    // Wrong password
    const wrongPwdResponse = await request.post(`${apiUrl}/api/auth/login`, {
      data: { email, password: 'WrongPassword' },
    });
    expect(wrongPwdResponse.status()).toBe(401);

    // Non-existent user
    const noUserResponse = await request.post(`${apiUrl}/api/auth/login`, {
      data: { email: 'nonexistent@example.com', password: 'AnyPassword' },
    });
    expect(noUserResponse.status()).toBe(401);
  });
});
