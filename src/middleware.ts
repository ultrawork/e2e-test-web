import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const apiUrl = process.env.API_URL || 'http://localhost:3001';
  const destination = new URL(
    request.nextUrl.pathname + request.nextUrl.search,
    apiUrl,
  );
  return NextResponse.rewrite(destination);
}

export const config = {
  matcher: '/api/:path*',
};
