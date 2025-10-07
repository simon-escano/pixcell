'use server'

import { db } from "@/db";
import { profile, user, role, image } from "@/db/schema";
import { getSupabaseAuth } from "@/lib/auth";
import { getErrorMessage } from "@/utils";
import { createClient } from "@supabase/supabase-js";
import { eq } from "drizzle-orm";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase URL or Key");
}
const supabase = createClient(supabaseUrl, supabaseKey);
const backendBaseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";

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
    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    const roleId = formData.get("roleId") as string;
    const licenseNo = (formData.get("licenseNo") as string) || undefined;

    // Call backend to handle account creation and profile insert
    const res = await fetch(`${backendBaseUrl}/auth/signup-json`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, firstName, lastName, roleId, licenseNo }),
      // Include credentials so backend can set auth cookies if it chooses to
      credentials: "include",
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.errorMessage) {
      return { errorMessage: data.errorMessage || `Signup failed (${res.status})` };
    }
    return { errorMessage: null };
  } catch (error) {
    return { errorMessage: getErrorMessage(error) };
  }
};

// export const loginAction = async (formData: FormData) => {
//   try {
//     const email = formData.get("email") as string;
//     const password = formData.get("password") as string;

//     const res = await fetch(`${backendBaseUrl}/auth/login-json`, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       credentials: "include",
//       body: JSON.stringify({ email, password }),
//     });
//     const data = await res.json().catch(() => ({}));
//     if (!res.ok || data.errorMessage) {
//       return { errorMessage: data.errorMessage || `Login failed (${res.status})` };
//     }
//     return { errorMessage: null };
//   } catch (error) {
//     return { errorMessage: getErrorMessage(error) };
//   }
// };

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

export const resetPasswordAction = async (formData: FormData) => {
  try {
    const email = (formData.get("email") as string)?.trim();
    console.log("EMAIL:", email);

    // Validate email
    if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { errorMessage: "Please provide a valid email address" };
    }

    const auth = await getSupabaseAuth();

    const { data, error } = await auth.resetPasswordForEmail(email 
    ,{redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?type=recovery`,}
    );
    console.log("Supabase response:", { data, error });

    if (error) {
      throw new Error(error.message || "Failed to send reset email");
    }

    return { errorMessage: null };
  } catch (error) {
    console.error("Supabase error:", error);
    return { errorMessage: getErrorMessage(error) };
  }
};

export async function deleteUser(userId: string) {
  try {
    logServer("Starting user deletion process", { userId });

    // Get profile data to check for image
    const profileData = await db.select().from(profile).where(eq(profile.userId, userId)).limit(1);
    const imageId = profileData[0]?.imageId;
    let imageUrl: string | undefined = undefined;
    if (imageId) {
      const imageData = await db.select().from(image).where(eq(image.id, imageId)).limit(1);
      imageUrl = imageData[0]?.imageUrl ?? undefined;
    }

    if (imageUrl) {
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

    // Delete records in the correct order to handle foreign key constraints
    try {
      await db.transaction(async (tx) => {
        // Delete profile first (it has foreign key to user)
        await tx.delete(profile).where(eq(profile.userId, userId));
        
        // Delete user record
        await tx.delete(user).where(eq(user.id, userId));
        
        // Delete image last (if it exists)
        if (imageId) {
          await tx.delete(image).where(eq(image.id, imageId));
        }
      });
    } catch (dbError) {
      logServer("Database deletion failed", { error: dbError });
      return { success: false, error: "Failed to delete user records from database" };
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
        // Update user table - only include phone if it has a value
        const userUpdateData = {
          email,
          ...(phone && phone.trim() !== "" ? { phone } : {})
        };
        logServer("Updating user with data", userUpdateData);
        
        await tx.update(user)
          .set(userUpdateData)
          .where(eq(user.id, userId));

        // Update profile table
        const profileUpdateData = {
          firstName: firstname,
          lastName,
          roleId,
          ...(imageId ? { imageId } : {})
        };
        logServer("Updating profile with data", profileUpdateData);
        
        await tx.update(profile)
          .set(profileUpdateData)
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

export const logoutAllDevicesAction = async () => {
  try {
    const auth = await getSupabaseAuth();
    
    // This will invalidate all refresh tokens
    const { error } = await auth.signOut({ scope: 'global' });
    if (error) throw error;

    return { errorMessage: null };
  } catch (error) {
    return { errorMessage: getErrorMessage(error) };
  }
};

export const changePasswordAction = async (currentPassword: string, newPassword: string) => {
  try {
    const auth = await getSupabaseAuth();

    // First verify the current password by attempting to sign in
    const { data: { user } } = await auth.getUser();
    if (!user?.email) throw new Error("No user found");

    const { error: verifyError } = await auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });

    if (verifyError) throw new Error("Current password is incorrect");

    // If verification successful, update to new password
    const { error } = await auth.updateUser({ password: newPassword });
    if (error) throw error;

    // Update the profile to mark that password has been changed
    await db.update(profile)
      .set({ mustChangePassword: false })
      .where(eq(profile.userId, user.id));

    return { errorMessage: null };
  } catch (error) {
    return { errorMessage: getErrorMessage(error) };
  }
};

export const createUserWithAutoPasswordAction = async (formData: FormData) => {
  try {
    const email = formData.get("email") as string;
    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    const roleId = formData.get("roleId") as string;
    const licenseNo = (formData.get("licenseNo") as string) || undefined;

    const res = await fetch(`${backendBaseUrl}/auth/create-user-auto-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, firstName, lastName, roleId, licenseNo }),
      credentials: "include",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.errorMessage === "string") {
      return { errorMessage: data.errorMessage || `Create user failed (${res.status})` };
    }
    return { errorMessage: null };
  } catch (error) {
    return { errorMessage: getErrorMessage(error) };
  }
};

export const checkAccountExistsAction = async (email: string) => {
  try {
    // Validate email
    if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return {
        exists: false,
        mustChangePassword: false,
        errorMessage: "Please provide a valid email address"
      };
    }

    // Call backend endpoint
    const res = await fetch(`${backendBaseUrl}/auth/email-exists/${encodeURIComponent(email)}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include", // Include cookies if needed for authentication
    });

    const data = await res.json().catch(() => ({}));
    
    if (!res.ok || data.errorMessage) {
      return {
        exists: false,
        mustChangePassword: false,
        errorMessage: data.errorMessage || `Failed to check email (${res.status})`
      };
    }

    return {
      exists: data.exists,
      mustChangePassword: data.mustChangePassword,
      errorMessage: data.errorMessage
    };
  } catch (error) {
    return {
      exists: false,
      mustChangePassword: false,
      errorMessage: getErrorMessage(error)
    };
  }
};

export const setupInitialPasswordAction = async (email: string, newPassword: string) => {
  try {
    // Validate inputs
    if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return {
        errorMessage: "Please provide a valid email address",
        requiresEmailVerification: false,
        message: null
      };
    }
    if (!newPassword || typeof newPassword !== "string" || newPassword.length < 6) {
      return {
        errorMessage: "Password must be at least 6 characters",
        requiresEmailVerification: false,
        message: null
      };
    }

    // Call backend endpoint
    const res = await fetch(`${backendBaseUrl}/auth/setup-initial-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include", // Include cookies if needed
      body: JSON.stringify({ email, newPassword })
    });

    const data = await res.json().catch(() => ({}));
    
    if (!res.ok || data.errorMessage) {
      return {
        errorMessage: data.errorMessage || `Failed to set password (${res.status})`,
        requiresEmailVerification: false,
        message: null
      };
    }

    return {
      errorMessage: data.errorMessage,
      requiresEmailVerification: data.requiresEmailVerification || false,
      message: data.message
    };
  } catch (error) {
    logServer("Setup initial password failed", { error });
    return {
      errorMessage: getErrorMessage(error),
      requiresEmailVerification: false,
      message: null
    };
  }
};