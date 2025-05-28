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

    // Get all form values
    const overallExperience = formData.get("overallExperience");
    const interfaceUsability = formData.get("interfaceUsability");
    const aiAccuracy = formData.get("aiAccuracy");
    const aiUsability = formData.get("aiUsability");
    const collaborationTools = formData.get("collaborationTools");
    const collaborationIssues = formData.get("collaborationIssues");
    const featureSuggestions = formData.get("featureSuggestions") as string;
    const technicalIssues = formData.get("technicalIssues") as string;
    const recommendation = formData.get("recommendation");
    const additionalComments = formData.get("additionalComments") as string;

    // Check if at least one field has been filled
    const hasRating = [
      overallExperience,
      interfaceUsability,
      aiAccuracy,
      aiUsability,
      collaborationTools,
      collaborationIssues,
      recommendation
    ].some(value => value !== null && value !== "");

    const hasText = [
      featureSuggestions,
      technicalIssues,
      additionalComments
    ].some(value => value && value.trim() !== "");

    if (!hasRating && !hasText) {
      throw new Error("Please answer at least one question before submitting the feedback");
    }

    await db.insert(feedback).values({
      userId: session.data.session.user.id,
      overallExperience: overallExperience ? parseInt(overallExperience as string) : null,
      interfaceUsability: interfaceUsability ? parseInt(interfaceUsability as string) : null,
      aiAccuracy: aiAccuracy ? parseInt(aiAccuracy as string) : null,
      aiUsability: aiUsability ? parseInt(aiUsability as string) : null,
      collaborationTools: collaborationTools ? parseInt(collaborationTools as string) : null,
      collaborationIssues: collaborationIssues ? parseInt(collaborationIssues as string) : null,
      featureSuggestions: featureSuggestions?.trim() || null,
      technicalIssues: technicalIssues?.trim() || null,
      recommendation: recommendation ? parseInt(recommendation as string) : null,
      additionalComments: additionalComments?.trim() || null,
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