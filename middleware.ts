import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getUserFromSession } from '@/lib/supabase/server';

export async function middleware(request: NextRequest) {
  // Retrieve the authenticated user via the shared SSR helper (uses anon key & cookie)
  const user = await getUserFromSession();

  const protectedRoutes = ['/dashboard', '/quests', '/character', '/relics'];
  const pathname = request.nextUrl.pathname;
  const isProtected = protectedRoutes.some((base) => pathname.startsWith(base));

  if (isProtected && !user) {
    const loginUrl = new URL('/auth/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/quests/:path*',
    '/character/:path*',
    '/relics/:path*',
  ],
};
