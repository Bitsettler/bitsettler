import createMiddleware from 'next-intl/middleware';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Create the internationalization middleware
const intlMiddleware = createMiddleware({
  // A list of all locales that are supported
  locales: ['en', 'fr', 'es'],
  // Used when no locale matches
  defaultLocale: 'en'
});

export async function middleware(request: NextRequest) {
  // Start with the internationalization middleware
  let response = intlMiddleware(request);

  // EXPERIMENTAL: Add Supabase middleware (can be disabled)
  const ENABLE_SUPABASE_MIDDLEWARE = false; // Set to true to test

  if (ENABLE_SUPABASE_MIDDLEWARE) {
    // Create Supabase client
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            request.cookies.set({ name, value, ...options });
            response.cookies.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            request.cookies.set({ name, value: '', ...options });
            response.cookies.set({ name, value: '', ...options });
          }
        }
      }
    );

    // Refresh the session if needed
    await supabase.auth.getUser();
  }

  return response;
}

export const config = {
  // Match only internationalized pathnames, excluding API routes
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)']
};
