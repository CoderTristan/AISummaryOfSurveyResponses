'use client';

import { useEffect, useState, ChangeEvent } from "react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";

interface OneQWidgetProps {
  surveyId: string;
}

export default function OneQWidget({ surveyId }: OneQWidgetProps) {
  const [survey, setSurvey] = useState<any>({
    question: "What's your favorite feature?",
    type: "multiple",
    options: ["Speed", "Design", "Support", "Pricing"],
    color: "#6366f1"
  });
  const [answer, setAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!answer) return;
    setSubmitting(true);
    try {
      await fetch('https://survey-delta-one.vercel.app/api/surveys/5c8d7309-110e-4b5e-88f3-7745ad13f6d4/responses', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer }),
      });
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      setSubmitting(false);
    }
  };

  const renderInput = () => {
    if (survey.type === "multiple" && survey.options?.length) {
      return (
        <div className="flex flex-col gap-2">
          {survey.options.map((o: string) => (
            <Button
              key={o}
              onClick={() => setAnswer(o)}
              style={{
                backgroundColor: answer === o ? "#6366f1" : "white",
                color: answer === o ? "white" : "#6366f1",
                borderColor: "#6366f1",
              }}
            >
              {o}
            </Button>
          ))}
        </div>
      );
    } else {
      return (
        <Textarea
          value={answer}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setAnswer(e.target.value)}
          placeholder="Type your answer…"
          className="w-full border-2"
          style={{ borderColor: "#6366f1" }}
        />
      );
    }
  };

  if (submitted) return <div>Thanks for responding!</div>;

  return (
    <div className="p-6 max-w-md mx-auto">
      <div className="mb-4 font-semibold text-lg">{survey.question}</div>
      {renderInput()}
      <Button
        onClick={submit}
        disabled={!answer || submitting}
        className="mt-4 w-full"
        style={{ backgroundColor: "#6366f1", color: "white" }}
      >
        {submitting ? "Submitting…" : "Submit"}
      </Button>
    </div>
  );
}