'use server'

import { db } from "@/db";
import { profile, user, role, image, organizationStaff } from "@/db/schema";
import { getSupabaseAuth } from "@/lib/auth";
import { getErrorMessage } from "@/utils"
import { createClient } from "@supabase/supabase-js";
import { eq, and } from "drizzle-orm";

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
    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    const roleId = formData.get("roleId") as string;
    const licenseNo = formData.get("licenseNo") as string;

    // Check if email already exists
    const existing = await db.select().from(user).where(eq(user.email, email)).limit(1);
    if (existing.length > 0) {
      return { errorMessage: "Email already exists." };
    }

    const auth = await getSupabaseAuth();

    const { data, error } = await auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/login`
      }
    });
    if (error) throw error;

    // Get the userId from the signUp response
    const userId = data.user?.id;
    if (!userId) throw new Error("User ID not returned from sign up");

    // const { data, error: loginError } = await auth.signInWithPassword({ email, password });
    // if (loginError) throw loginError;
    // if (!data.session) throw new Error("No session");

    //const userId = data.session.user.id;

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
      .where(eq(role.id, roleId));

      if (!result) {
        throw new Error(`Role with id "${roleId}" not found in the database`);
      }

    await db.insert(profile).values({
      id: userId,
      firstName,
      lastName,
      userId,
      roleId,
      imageId,
      licenseNo,
    });

    console.log("Profile insert values:", {
      id: userId,
      firstName,
      lastName,
      userId,
      roleId,
      imageId,
    });

    console.log("Role query result:", result);

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

export async function updateUser(userId: string, firstname: string, lastName: string, email: string, roleId: string, organizationId: string, phone?: string, file?: File) {
  try {
    if (!userId || !firstname || !lastName || !email || !roleId || !organizationId) {
      throw new Error("Missing required fields: userId, firstname, lastName, email, roleId, and organizationId are required.");
    }

    logServer("Starting user update process", { userId, firstname, lastName, email, roleId, organizationId });

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
      logServer("Updating user, profile, and organizationStaff records");
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

        // Update profile table (without roleId)
        const profileUpdateData = {
          firstName: firstname,
          lastName,
          ...(imageId ? { imageId } : {})
        };
        logServer("Updating profile with data", profileUpdateData);
        
        await tx.update(profile)
          .set(profileUpdateData)
          .where(eq(profile.userId, userId));

        // Update organizationStaff roleId for this specific organization
        logServer("Updating organizationStaff roleId", { profileId: profileData[0].id, organizationId, roleId });
        await tx.update(organizationStaff)
          .set({ roleId })
          .where(
            and(
              eq(organizationStaff.staffId, profileData[0].id),
              eq(organizationStaff.organizationId, organizationId)
            )
          );
      });

      logServer("Successfully updated user, profile, and organizationStaff");
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
    const licenseNo = formData.get("licenseNo") as string;
    const organizationId = formData.get("organizationId") as string;

    // Generate a secure random password
    const generatePassword = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
      let password = '';
      for (let i = 0; i < 12; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return password;
    };

    const autoGeneratedPassword = generatePassword();

    // Check if email already exists
    const existing = await db.select().from(user).where(eq(user.email, email)).limit(1);
    if (existing.length > 0) {
      return { errorMessage: "Email already exists." };
    }

    const auth = await getSupabaseAuth();

    const { data, error } = await auth.signUp({
      email,
      password: autoGeneratedPassword,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/login`
      }
    });
    if (error) throw error;

    // Get the userId from the signUp response
    const userId = data.user?.id;
    if (!userId) throw new Error("User ID not returned from sign up");

    const imageUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(firstName)}%${encodeURIComponent(lastName)}`;

    const [imageInsert] = await db
      .insert(image)
      .values({
        id: crypto.randomUUID(),
        imageUrl,
      })
      .returning({ id: image.id });

    const imageId = imageInsert.id;

    const [result] = await db
      .select()
      .from(role)
      .where(eq(role.id, roleId));

    if (!result) {
      throw new Error(`Role with id "${roleId}" not found in the database`);
    }

    // Validate organizationId
    if (!organizationId || organizationId.trim() === "") {
      throw new Error("Organization ID is required");
    }

    logServer("Creating user with organizationId", { userId, organizationId, profileId: userId });

    // Use transaction to ensure atomicity
    await db.transaction(async (tx) => {
      // Insert profile (roleId is temporary placeholder - will be removed when column is deleted)
      // Get first role as placeholder since roleId is still required in schema
      const [firstRole] = await tx.select().from(role).limit(1);
      const placeholderRoleId = firstRole?.id || crypto.randomUUID();
      
      await tx.insert(profile).values({
        id: userId,
        firstName,
        lastName,
        userId,
        roleId: placeholderRoleId, // Temporary - will be removed when roleId column is deleted
        imageId,
        licenseNo,
        mustChangePassword: true,
      });

      // Create organizationStaff entry to link user to organization with roleId
      logServer("Inserting into organizationStaff", { organizationId, staffId: userId, roleId });
      const [orgStaffResult] = await tx.insert(organizationStaff).values({
        organizationId,
        staffId: userId, // profile.id is the same as userId
        roleId,
      }).returning();
      logServer("Successfully inserted into organizationStaff", orgStaffResult);
    });

    // Verify the organizationStaff entry was created
    const verifyOrgStaff = await db.select().from(organizationStaff)
      .where(and(
        eq(organizationStaff.staffId, userId),
        eq(organizationStaff.organizationId, organizationId)
      ))
      .limit(1);
    
    if (verifyOrgStaff.length === 0) {
      logServer("WARNING: organizationStaff entry not found after insert", { userId, organizationId });
      throw new Error("Failed to create organization staff relationship");
    }

    logServer("Verified organizationStaff entry exists", verifyOrgStaff[0]);

    return { errorMessage: null };
  } catch (error) {
    return { errorMessage: getErrorMessage(error) };
  }
};

export const checkAccountExistsAction = async (email: string) => {
  try {
    // Check if email exists in our database
    const existing = await db.select().from(user).where(eq(user.email, email)).limit(1);
    
    if (existing.length === 0) {
      return { 
        exists: false, 
        mustChangePassword: false,
        errorMessage: "Account not found. Please check your email or contact your administrator." 
      };
    }

    // Get profile to check if password change is required
    const profileData = await db.select().from(profile).where(eq(profile.userId, existing[0].id)).limit(1);
    
    if (profileData.length === 0) {
      return { 
        exists: false, 
        mustChangePassword: false,
        errorMessage: "Profile not found. Please contact your administrator." 
      };
    }

    return { 
      exists: true, 
      mustChangePassword: profileData[0].mustChangePassword,
      errorMessage: null 
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
    // First, get the user from our database
    const userData = await db.select().from(user).where(eq(user.email, email)).limit(1);
    if (userData.length === 0) {
      return { errorMessage: "User not found" };
    }

    const userId = userData[0].id;

    // Try to update the password using the service role client
    try {
      const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
        password: newPassword
      });
      
      if (updateError) {
        // If direct update fails, fall back to password reset flow
        const { error: resetError } = await supabase.auth.admin.generateLink({
          type: 'recovery',
          email: email,
          options: {
            redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?type=recovery&email=${encodeURIComponent(email)}`
          }
        });
        
        if (resetError) throw resetError;
        
        return { 
          errorMessage: null, 
          requiresEmailVerification: true,
          message: "A password reset link has been sent to your email. Please check your inbox and follow the link to set your password."
        };
      }

      // Update the profile to mark that password has been set
      await db.update(profile)
        .set({ mustChangePassword: false })
        .where(eq(profile.userId, userId));

      return { errorMessage: null };
    } catch (adminError) {
      // If admin operations fail, use password reset flow
      const { error: resetError } = await supabase.auth.admin.generateLink({
        type: 'recovery',
        email: email,
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?type=recovery&email=${encodeURIComponent(email)}`
        }
      });
      
      if (resetError) throw resetError;
      
      return { 
        errorMessage: null, 
        requiresEmailVerification: true,
        message: "A password reset link has been sent to your email. Please check your inbox and follow the link to set your password."
      };
    }
  } catch (error) {
    return { errorMessage: getErrorMessage(error) };
  }
};