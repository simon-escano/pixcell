'use server'

import { db } from "@/db";
import { profile, user, role, image } from "@/db/schema";
import { getSupabaseAuth } from "@/lib/auth";
import { getErrorMessage } from "@/lib/utils"
import { createClient } from "@supabase/supabase-js";
import { eq } from "drizzle-orm";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase URL or Key");
}
const supabase = createClient(supabaseUrl, supabaseKey);

export const signupAction = async (formData: FormData) => {
  try {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const firstName = formData.get("firstname") as string;
    const lastName = formData.get("lastname") as string;
    const roleName = formData.get("role") as string;

    const auth = await getSupabaseAuth();

    const { error } = await auth.signUp({ email, password });
    if (error) throw error;

    const { data, error: loginError } = await auth.signInWithPassword({ email, password });
    if (loginError) throw loginError;
    if (!data.session) throw new Error("No session");

    const userId = data.session.user.id;

    const imageUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(firstName)}%${encodeURIComponent(lastName)}`;

    const [imageInsert] = await db
      .insert(image)
      .values({
        id: crypto.randomUUID(), // or use drizzle's uuid() if available
        imageUrl,
      })
      .returning({ id: image.id });

    const imageId = imageInsert.id;

    const [result] = await db
      .select()
      .from(role)
      .where(eq(role.name, roleName));
    const roleId = result.id

    await db.insert(profile).values({
      id: userId,
      userId,
      firstName,
      lastName,
      roleId,
      imageId,
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

export async function deleteUser(userId: string) {
  try {
    const profileData = await db.select().from(profile).where(eq(profile.userId, userId)).limit(1);
    const imageUrl = profileData[0]?.imageUrl;

    if (imageUrl) {
      const path = imageUrl.split('/storage/v1/object/public/avatars/')[1];
      if (path) {
        const { error: deleteError } = await supabase.storage
          .from('avatars')
          .remove([path]);

        if (deleteError) {
          console.error("Failed to delete avatar from storage:", deleteError);
          return { success: false, error: "Failed to delete avatar from storage" };
        }
      }
    }

    await db.transaction(async (tx) => {
      await tx.delete(profile).where(eq(profile.userId, userId));
      await tx.delete(user).where(eq(user.id, userId));
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to delete user:", error);
    return { success: false, error: "Something went wrong." };
  }
}

export async function updateUser(userId: string, firstname: string, lastName: string, email: string, roleId: string, phone?: string, file?: File) {
  let imageUrl: string | undefined;

  if (!userId || !firstname || !lastName || !email || !roleId) {
    throw new Error("Missing required fields: userId, firstname, lastName, email, and roleId are required.");
  }

  if (file) {
    try {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const fileName = `${Date.now()}-${file.name}`;

      const { data, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, buffer, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        console.error("Supabase Storage upload failed:", uploadError);
        throw new Error(`Failed to upload image: ${uploadError.message}`);
      }

      imageUrl = `${supabaseUrl}/storage/v1/object/public/avatars/${data.path}`;
    } catch (error) {
      console.error("Error uploading file:", error);
      return { success: false, error: "Failed to upload image" };
    }
  }

  try {
    await db.transaction(async (tx) => {
      await tx.update(user).set({ email, ...(phone !== undefined ? { phone } : {}) }).where(eq(user.id, userId));
      await tx.update(profile).set({
        firstName: firstname,
        lastName,
        ...(imageUrl ? { imageUrl } : {}),
        roleId,
      }).where(eq(profile.userId, userId));
    });

    return { success: true, imageUrl };
  } catch (error: any) {
    console.error("Database update failed:", error);
    return { success: false, error: "Failed to update user" };
  }
}

