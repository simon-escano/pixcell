import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { cache } from 'react';

// Cache the cookie promise per request
const getCookieStore = cache(() => {
  return cookies();
});

export async function createClient() {
  // Pass the async cookies function directly - the library will handle awaiting it
  return createServerComponentClient({
    cookies: getCookieStore,
  });
}
