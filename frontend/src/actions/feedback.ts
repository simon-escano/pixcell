'use server'

import { db } from "@/db";
import { feedback } from "@/db/schema";
import { getSupabaseAuth } from "@/lib/auth";
import { getErrorMessage } from "@/lib/utils";
import { getFeedbackByUser as getFeedbackByUserQuery } from "@/db/queries/select";

export async function submitFeedback(formData: FormData) {
  try {
    const auth = await getSupabaseAuth();
    const session = await auth.getSession();
    
    if (!session.data.session) {
      throw new Error("You must be logged in to submit feedback");
    }

    const subject = formData.get("subject") as string;
    const message = formData.get("message") as string;

    if (!subject || !message) {
      throw new Error("Subject and message are required");
    }

    await db.insert(feedback).values({
      userId: session.data.session.user.id,
      subject,
      message,
    });

    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

export async function getFeedbackByUser() {
  try {
    const auth = await getSupabaseAuth();
    const session = await auth.getSession();
    
    if (!session.data.session) {
      throw new Error("You must be logged in to view feedback");
    }

    const userFeedback = await getFeedbackByUserQuery(session.data.session.user.id);

    return { data: userFeedback, error: null };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}