'use server'

import { db } from "@/db";
import { profile } from "@/db/schema";
import { getSupabaseAuth } from "@/lib/auth";
import { getErrorMessage } from "@/lib/utils"

export const signupAction = async (formData: FormData) => {
  try {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const firstName = formData.get("firstname") as string;
    const lastName = formData.get("lastname") as string;
    const role = formData.get("role") as string;

    const auth = await getSupabaseAuth();

    const { error } = await auth.signUp({ email, password });
    if (error) throw error;

    const { data, error: loginError } = await auth.signInWithPassword({ email, password });
    if (loginError) throw loginError;
    if (!data.session) throw new Error("No session");

    const userId = data.session.user.id;

    const imageUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(firstName)}%${encodeURIComponent(lastName)}`;

    await db.insert(profile).values({
      id: userId,
      userId,
      roleId: role,
      imageUrl,
      firstName,
      lastName
    });

    return { errorMessage: null };
  } catch (error) {
    return { errorMessage: getErrorMessage(error) };
  }
};

export const loginAction = async (formData: FormData) => {
  try {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const auth = await getSupabaseAuth();

    const { data, error: loginError } = await auth.signInWithPassword({ email, password });
    if (loginError) throw loginError;
    if (!data.session) throw new Error("No session");

    return { errorMessage: null };
  } catch (error) {
    return { errorMessage: getErrorMessage(error) };
  }
};

export const logoutAction = async () => {
  try {
    const auth = await getSupabaseAuth();

    const { error } = await auth.signOut();
    if (error) throw error;

    return { errorMessage: null };
  } catch (error) {
    return { errorMessage: getErrorMessage(error) };
  }
};