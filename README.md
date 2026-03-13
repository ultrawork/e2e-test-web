# Notes App

Cross-platform note-taking application with real-time synchronization across web, iOS, and Android. Simple MVP for managing text notes with categories (Personal, Work, Ideas), search, and email/password authentication.

## Tech Stack

| Layer    | Technology                              |
|----------|-----------------------------------------|
| Backend  | Express.js, Prisma ORM, PostgreSQL, JWT |
| Web      | Next.js, TypeScript                     |
| iOS      | SwiftUI                                 |
| Android  | Kotlin, Jetpack Compose, Hilt, Room     |
| DevOps   | Docker, Docker Compose, GitHub Actions  |
| Deploy   | Hetzner VPS                             |

## Getting Started

### Prerequisites

- Node.js >= 18
- Docker & Docker Compose
- PostgreSQL 15+ (or use Docker)
- Xcode 15+ (for iOS)
- Android Studio (for Android)

### Setup

1. Clone the repository:

```bash
git clone https://github.com/ultrawork/e2e-test-web.git
cd e2e-test-web
```

2. Copy environment variables:

```bash
cp .env.example .env
```

3. Start services with Docker Compose:

```bash
docker compose up -d
```

4. Run database migrations:

```bash
cd backend
npx prisma migrate dev
```

The backend API will be available at `http://localhost:3001` and the web app at `http://localhost:3000`.

### Running Individual Services

```bash
# Backend
cd backend && npm install && npm run dev

# Web
cd web && npm install && npm run dev
```

## Project Structure

```
├── backend/          # Express.js API + Prisma ORM
│   ├── prisma/       # Database schema & migrations
│   └── src/          # Source code (routes, middleware, config)
├── web/              # Next.js web application
│   └── src/app/      # App Router pages & components
├── ios/              # SwiftUI iOS application
│   └── NotesApp/     # Xcode project
├── android/          # Kotlin + Jetpack Compose Android app
│   └── app/          # Application module
├── .github/          # CI/CD workflows
├── docker-compose.yml
└── .env.example      # Environment variables template
```

## Environment Variables

See [`.env.example`](.env.example) for the full list of required environment variables.
