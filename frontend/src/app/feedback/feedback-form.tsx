'use client'

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { submitFeedback } from "@/actions/feedback";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import toast from "react-hot-toast";
import React from "react";

const ratingOptions = [
  { value: "1", label: "Very Poor" },
  { value: "2", label: "Poor" },
  { value: "3", label: "Neutral" },
  { value: "4", label: "Good" },
  { value: "5", label: "Excellent" },
];

const usabilityOptions = [
  { value: "1", label: "Very Difficult" },
  { value: "2", label: "Difficult" },
  { value: "3", label: "Neutral" },
  { value: "4", label: "Easy" },
  { value: "5", label: "Very Easy" },
];

const accuracyOptions = [
  { value: "1", label: "Very Inaccurate" },
  { value: "2", label: "Inaccurate" },
  { value: "3", label: "Acceptable" },
  { value: "4", label: "Accurate" },
  { value: "5", label: "Very Accurate" },
];

const usefulnessOptions = [
  { value: "1", label: "Not Useful" },
  { value: "2", label: "Slightly Useful" },
  { value: "3", label: "Moderately Useful" },
  { value: "4", label: "Useful" },
  { value: "5", label: "Extremely Useful" },
];

const frequencyOptions = [
  { value: "1", label: "Never" },
  { value: "2", label: "Rarely" },
  { value: "3", label: "Occasionally" },
  { value: "4", label: "Frequently" },
  { value: "5", label: "Always" },
];

const recommendationOptions = [
  { value: "1", label: "Definitely Not" },
  { value: "2", label: "Probably Not" },
  { value: "3", label: "Not Sure" },
  { value: "4", label: "Probably Yes" },
  { value: "5", label: "Definitely Yes" },
];

export function FeedbackForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = React.useRef<HTMLFormElement>(null);

  const [overallExperience, setOverallExperience] = useState("");
  const [interfaceUsability, setInterfaceUsability] = useState("");
  const [aiAccuracy, setAiAccuracy] = useState("");
  const [aiUsability, setAiUsability] = useState("");
  const [collaborationTools, setCollaborationTools] = useState("");
  const [collaborationIssues, setCollaborationIssues] = useState("");
  const [featureSuggestions, setFeatureSuggestions] = useState("");
  const [technicalIssues, setTechnicalIssues] = useState("");
  const [recommendation, setRecommendation] = useState("");
  const [additionalComments, setAdditionalComments] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const formData = new FormData(formRef.current!);
      const result = await submitFeedback(formData);
      if (result.success) {
        toast.success("Feedback submitted successfully!");
        router.refresh();
        formRef.current?.reset();
        setOverallExperience("");
        setInterfaceUsability("");
        setAiAccuracy("");
        setAiUsability("");
        setCollaborationTools("");
        setCollaborationIssues("");
        setFeatureSuggestions("");
        setTechnicalIssues("");
        setRecommendation("");
        setAdditionalComments("");
      } else {
        toast.error(result.error || "Failed to submit feedback");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form id="feedback-form" ref={formRef} onSubmit={handleSubmit} className="space-y-8">
      {/* Section 1: Overall Experience */}
      <Card className="p-6">
        <div className="space-y-6">
          <div className="border-b pb-2">
            <h3 className="text-lg font-semibold">Overall Experience</h3>
            <p className="text-sm text-muted-foreground">Tell us about your general experience with PixCell</p>
          </div>
          
          <div className="space-y-4">
            <div className="bg-muted/50 p-4 rounded-lg">
              <Label className="text-sm font-medium mb-3 block">
                1. How would you rate your overall experience using PixCell?
              </Label>
              <RadioGroup
                name="overallExperience"
                value={overallExperience}
                onValueChange={setOverallExperience}
                className="grid grid-cols-1 gap-2"
              >
                {ratingOptions.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={option.value} id={`overall-${option.value}`} />
                    <Label htmlFor={`overall-${option.value}`} className="text-sm font-normal">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg">
              <Label className="text-sm font-medium mb-3 block">
                2. How easy was it to navigate and use the interface?
              </Label>
              <RadioGroup
                name="interfaceUsability"
                value={interfaceUsability}
                onValueChange={setInterfaceUsability}
                className="grid grid-cols-1 gap-2"
              >
                {usabilityOptions.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={option.value} id={`usability-${option.value}`} />
                    <Label htmlFor={`usability-${option.value}`} className="text-sm font-normal">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </div>
        </div>
      </Card>

      {/* Section 2: AI Assistance & Accuracy */}
      <Card className="p-6">
        <div className="space-y-6">
          <div className="border-b pb-2">
            <h3 className="text-lg font-semibold">AI Assistance & Accuracy</h3>
            <p className="text-sm text-muted-foreground">Evaluate the AI features and their effectiveness</p>
          </div>
          
          <div className="space-y-4">
            <div className="bg-muted/50 p-4 rounded-lg">
              <Label className="text-sm font-medium mb-3 block">
                3. How accurate do you find the AI detection of abnormal cells?
              </Label>
              <RadioGroup
                name="aiAccuracy"
                value={aiAccuracy}
                onValueChange={setAiAccuracy}
                className="grid grid-cols-1 gap-2"
              >
                {accuracyOptions.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={option.value} id={`accuracy-${option.value}`} />
                    <Label htmlFor={`accuracy-${option.value}`} className="text-sm font-normal">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg">
              <Label className="text-sm font-medium mb-3 block">
                4. How useful are the AI-generated annotations and reports in your diagnosis?
              </Label>
              <RadioGroup
                name="aiUsability"
                value={aiUsability}
                onValueChange={setAiUsability}
                className="grid grid-cols-1 gap-2"
              >
                {usefulnessOptions.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={option.value} id={`ai-usability-${option.value}`} />
                    <Label htmlFor={`ai-usability-${option.value}`} className="text-sm font-normal">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </div>
        </div>
      </Card>

      {/* Section 3: Collaboration Features */}
      <Card className="p-6">
        <div className="space-y-6">
          <div className="border-b pb-2">
            <h3 className="text-lg font-semibold">Collaboration Features</h3>
            <p className="text-sm text-muted-foreground">Rate your experience with our collaboration tools</p>
          </div>
          
          <div className="space-y-4">
            <div className="bg-muted/50 p-4 rounded-lg">
              <Label className="text-sm font-medium mb-3 block">
                5. How would you rate the real-time collaboration tools?
              </Label>
              <RadioGroup
                name="collaborationTools"
                value={collaborationTools}
                onValueChange={setCollaborationTools}
                className="grid grid-cols-1 gap-2"
              >
                {ratingOptions.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={option.value} id={`collab-tools-${option.value}`} />
                    <Label htmlFor={`collab-tools-${option.value}`} className="text-sm font-normal">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg">
              <Label className="text-sm font-medium mb-3 block">
                6. Did you experience any lag or syncing issues during collaboration?
              </Label>
              <RadioGroup
                name="collaborationIssues"
                value={collaborationIssues}
                onValueChange={setCollaborationIssues}
                className="grid grid-cols-1 gap-2"
              >
                {frequencyOptions.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={option.value} id={`collab-issues-${option.value}`} />
                    <Label htmlFor={`collab-issues-${option.value}`} className="text-sm font-normal">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </div>
        </div>
      </Card>

      {/* Section 4: Suggestions and Issues */}
      <Card className="p-6">
        <div className="space-y-6">
          <div className="border-b pb-2">
            <h3 className="text-lg font-semibold">Suggestions and Issues</h3>
            <p className="text-sm text-muted-foreground">Share your ideas and report any problems</p>
          </div>
          
          <div className="space-y-4">
            <div className="bg-muted/50 p-4 rounded-lg">
              <Label htmlFor="featureSuggestions" className="text-sm font-medium mb-3 block">
                7. What features would you like to see added or improved?
              </Label>
              <Textarea
                id="featureSuggestions"
                name="featureSuggestions"
                value={featureSuggestions}
                onChange={(e) => setFeatureSuggestions(e.target.value)}
                placeholder="Please share your suggestions..."
                rows={3}
                className="bg-background"
              />
            </div>

            <div className="bg-muted/50 p-4 rounded-lg">
              <Label htmlFor="technicalIssues" className="text-sm font-medium mb-3 block">
                8. Have you encountered any bugs or technical issues?
              </Label>
              <Textarea
                id="technicalIssues"
                name="technicalIssues"
                value={technicalIssues}
                onChange={(e) => setTechnicalIssues(e.target.value)}
                placeholder="Please describe any issues..."
                rows={3}
                className="bg-background"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Section 5: Final Thoughts */}
      <Card className="p-6">
        <div className="space-y-6">
          <div className="border-b pb-2">
            <h3 className="text-lg font-semibold">Final Thoughts</h3>
            <p className="text-sm text-muted-foreground">Share your overall thoughts and recommendations</p>
          </div>
          
          <div className="space-y-4">
            <div className="bg-muted/50 p-4 rounded-lg">
              <Label className="text-sm font-medium mb-3 block">
                9. Would you recommend PixCell to other medical professionals?
              </Label>
              <RadioGroup
                name="recommendation"
                value={recommendation}
                onValueChange={setRecommendation}
                className="grid grid-cols-1 gap-2"
              >
                {recommendationOptions.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={option.value} id={`recommend-${option.value}`} />
                    <Label htmlFor={`recommend-${option.value}`} className="text-sm font-normal">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg">
              <Label htmlFor="additionalComments" className="text-sm font-medium mb-3 block">
                10. Any other feedback or comments?
              </Label>
              <Textarea
                id="additionalComments"
                name="additionalComments"
                value={additionalComments}
                onChange={(e) => setAdditionalComments(e.target.value)}
                placeholder="Please share any additional thoughts..."
                rows={3}
                className="bg-background"
              />
            </div>
          </div>
        </div>
      </Card>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Submitting..." : "Submit Feedback"}
      </Button>
    </form>
  );
}