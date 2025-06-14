import Base from "@/components/base";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FeedbackForm } from "./feedback-form";
import { getUser } from "@/lib/auth";

export default async function FeedbackPage() {
  const user = await getUser();

  return (
      <Base>
        <div className="container mx-auto py-10">
          <div className="max-w-3xl mx-auto px-4">
            <div className="text-left mb-8">
              <h1 className="text-3xl font-bold tracking-tight mb-2">Share your feedback</h1>
              <p className="text-muted-foreground">
                
                Whether it's about the AI accuracy, ease of collaboration, or something specific—you can rate just one thing that matters most to you, or give us a full review. We value your insights in making <strong>PixCell</strong> more effective for medical professionals.
              </p>
            </div>
            <FeedbackForm />
          </div>
        </div>
      </Base>

  );
}