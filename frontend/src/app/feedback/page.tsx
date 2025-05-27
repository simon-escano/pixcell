import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getFeedbackByUser } from "@/actions/feedback";
import { FeedbackForm } from "./feedback-form";
import { format } from "date-fns";

export default async function FeedbackPage() {
  const { data: userFeedback } = await getFeedbackByUser();

  return (
    <div className="container mx-auto py-10 space-y-8">
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

      {userFeedback && userFeedback.length > 0 && (
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold mb-4">Your Previous Feedback</h2>
          <div className="space-y-4">
            {userFeedback.map((feedback) => (
              <Card key={feedback.id}>
                <CardHeader>
                  <CardTitle>{feedback.subject}</CardTitle>
                  <CardDescription>
                    Submitted on {format(new Date(feedback.createdAt), "PPP")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">{feedback.message}</p>
                  <div className="mt-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      feedback.status === "pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-green-100 text-green-800"
                    }`}>
                      {feedback.status}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}