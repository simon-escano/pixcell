import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { cache } from 'react';

// Cache the cookie promise per request to avoid multiple reads
const getCookieStore = cache(async () => {
  return await cookies();
});

export async function getUser() {
  // Await the cookies before passing to createServerComponentClient
  const cookieStore = await getCookieStore();
  const supabase = createServerComponentClient({ cookies: () => cookieStore as any });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  return user;
}

export const getSupabaseAuth = async () => {
  // Await the cookies before passing to createServerComponentClient
  const cookieStore = await getCookieStore();
  const supabase = createServerComponentClient({ cookies: () => cookieStore as any });
  return supabase.auth;
};