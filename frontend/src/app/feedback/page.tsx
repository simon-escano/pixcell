import Base from "@/components/base";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FeedbackForm } from "./feedback-form";
import { getUser } from "@/lib/auth";

export default async function FeedbackPage() {
  const user = await getUser();

  return (
    <Base>
      <div className="container mx-auto py-10">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Submit Feedback</CardTitle>
              <CardDescription>
                We value your feedback! Let us know how we can improve your experience.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FeedbackForm />
            </CardContent>
          </Card>
        </div>
      </div>
    </Base>
  );
}