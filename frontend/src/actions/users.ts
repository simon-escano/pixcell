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

// Helper function for server-side logging
function logServer(message: string, data?: any) {
  // This will show up in your terminal where you run the Next.js server
  console.log(`[Server Action] ${message}`, data ? JSON.stringify(data, null, 2) : '');
}

// Helper function to convert null to undefined
function toUndefined<T>(value: T | null): T | undefined {
  return value === null ? undefined : value;
}

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
      firstName,
      lastName,
      userId,
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
    logServer("Starting user deletion process", { userId });

    // Get profile data to check for image
    const profileData = await db.select().from(profile).where(eq(profile.userId, userId)).limit(1);
    if (profileData.length === 0) {
      logServer("Profile not found", { userId });
      return { success: false, error: "Profile not found" };
    }

    logServer("Found profile data", profileData[0]);

    // Store imageId before deleting profile
    const imageId = toUndefined(profileData[0].imageId as any) as string | undefined;
    let imageUrl: string | undefined;

    if (imageId) {
      const imageData = await db.select().from(image).where(eq(image.id, imageId)).limit(1);
      if (imageData.length > 0) {
        imageUrl = imageData[0].imageUrl;
      }
    }

    // Delete profile and user records first
    logServer("Deleting profile and user records");
    await db.transaction(async (tx) => {
      await tx.delete(profile).where(eq(profile.userId, userId));
      await tx.delete(user).where(eq(user.id, userId));
    });
    logServer("Successfully deleted profile and user records");

    // If there was an image, delete it from database and storage
    if (imageId && imageUrl) {
      logServer("Deleting image record and storage", { imageId, imageUrl });
      
      // Delete image record first
      await db.delete(image).where(eq(image.id, imageId));
      logServer("Successfully deleted image record");

      // Then delete from storage
      const path = imageUrl.split('/storage/v1/object/public/avatars/')[1];
      if (path) {
        const { error: deleteError } = await supabase.storage
          .from('avatars')
          .remove([path]);

        if (deleteError) {
          logServer("Failed to delete image from storage", { error: deleteError });
          return { success: false, error: "Failed to delete avatar from storage" };
        }
        logServer("Successfully deleted image from storage");
      }
    }

    logServer("User deletion completed successfully");
    return { success: true };
  } catch (error) {
    logServer("Failed to delete user", { error });
    return { success: false, error: "Something went wrong." };
  }
}

export async function updateUser(userId: string, firstname: string, lastName: string, email: string, roleId: string, phone?: string, file?: File) {
  try {
    if (!userId || !firstname || !lastName || !email || !roleId) {
      throw new Error("Missing required fields: userId, firstname, lastName, email, and roleId are required.");
    }

    logServer("Starting user update process", { userId, firstname, lastName, email, roleId });

    // Get current profile data to check for existing image
    const profileData = await db.select().from(profile).where(eq(profile.userId, userId)).limit(1);
    if (profileData.length === 0) {
      logServer("Profile not found", { userId });
      return { success: false, error: "Profile not found" };
    }

    logServer("Found profile data", profileData[0]);

    let imageId: string | undefined;

    if (file) {
      try {
        logServer("Processing new image upload", { fileName: file.name, fileType: file.type });
        
        // If there's an existing image, delete it from storage
        if (profileData[0].imageId) {
          logServer("Found existing image ID", { imageId: profileData[0].imageId });
          
          const existingImage = await db.select().from(image).where(eq(image.id, profileData[0].imageId)).limit(1);
          logServer("Existing image data", existingImage[0]);

          if (existingImage.length > 0) {
            const imageUrl = existingImage[0].imageUrl;
            if (imageUrl) {
              logServer("Deleting existing image from storage", { imageUrl });
              const path = imageUrl.split('/storage/v1/object/public/avatars/')[1];
              if (path) {
                const { error: deleteError } = await supabase.storage
                  .from('avatars')
                  .remove([path]);

                if (deleteError) {
                  logServer("Failed to delete image from storage", { error: deleteError });
                  return { success: false, error: "Failed to delete old image from storage" };
                }
                logServer("Successfully deleted old image from storage");
              }
            }
          }
        }

        // Upload new image
        logServer("Uploading new image to storage");
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const fileName = `${Date.now()}-${file.name}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, buffer, {
            contentType: file.type,
            upsert: false,
          });

        if (uploadError) {
          logServer("Supabase Storage upload failed", { error: uploadError });
          throw new Error(`Failed to upload image: ${uploadError.message}`);
        }

        logServer("Successfully uploaded new image to storage", { uploadData });

        const imageUrl = `${supabaseUrl}/storage/v1/object/public/avatars/${uploadData.path}`;
        logServer("Generated image URL", { imageUrl });
        
        // Create new image record
        logServer("Creating new image record in database");
        const [newImage] = await db.insert(image)
          .values({
            id: crypto.randomUUID(),
            imageUrl: imageUrl
          })
          .returning();

        logServer("Created new image record", newImage);
        imageId = newImage.id;
      } catch (error) {
        logServer("Error handling image", { error });
        return { success: false, error: "Failed to handle image" };
      }
    }

    try {
      logServer("Updating user and profile records");
      await db.transaction(async (tx) => {
        // Update user table
        await tx.update(user)
          .set({ 
            email, 
            ...(phone !== undefined ? { phone } : {}) 
          })
          .where(eq(user.id, userId));

        // Update profile table
        const updateData = {
          firstName: firstname,
          lastName,
          roleId,
          ...(imageId ? { imageId } : {})
        };
        logServer("Updating profile with data", updateData);
        
        await tx.update(profile)
          .set(updateData)
          .where(eq(profile.userId, userId));
      });

      logServer("Successfully updated user and profile");
      return { success: true };
    } catch (error) {
      logServer("Database update failed", { error });
      return { success: false, error: "Failed to update user" };
    }
  } catch (error) {
    logServer("Update user failed", { error });
    return { success: false, error: "Something went wrong" };
  }
}

