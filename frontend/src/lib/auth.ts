import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { cache } from 'react';

// Cache the cookie promise per request to avoid multiple reads
const getCookieStore = cache(() => {
  return cookies();
});

export async function getUser() {
  // Pass the async cookies function directly - the library will handle awaiting it
  const supabase = createServerComponentClient({ cookies: getCookieStore });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  return user;
}

export const getSupabaseAuth = async () => {
  // Pass the async cookies function directly - the library will handle awaiting it
  const supabase = createServerComponentClient({ cookies: getCookieStore });
  return supabase.auth;
};