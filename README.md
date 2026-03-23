# Notes App — Web (Next.js)

Cross-platform notes application — web frontend built with Next.js 15 + React 19 + TypeScript.

## Backend Setup

1. Clone and run the `e2e-test-backend` service
2. Copy `.env.local.example` to `.env.local`
3. Set `NEXT_PUBLIC_API_URL` to your backend URL (default: `http://localhost:3000/api`)
4. Run `npm run dev` and open `http://localhost:3001/notes`

> **Note:** The backend API requires JWT authentication on all `/api/notes` routes. For local development, either disable `authMiddleware` on the backend or pass a valid token manually.
