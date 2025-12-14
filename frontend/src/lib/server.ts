import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { cache } from 'react';

// Cache the cookie promise per request
const getCookieStore = cache(async () => {
  return await cookies();
});

export async function createClient() {
  // Await the cookies before passing to createServerComponentClient
  const cookieStore = await getCookieStore();
  return createServerComponentClient({
    cookies: () => cookieStore,
  });
}
