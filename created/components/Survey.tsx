"use client";

import { useEffect, useState, ChangeEvent } from "react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";

interface PublicSurveyProps {
  surveyId: string;
}

export default function PublicSurvey({ surveyId }: PublicSurveyProps) {
  const [survey, setSurvey] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [answer, setAnswer] = useState<string>("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadSurvey() {
      try {
        const res = await fetch(`/api/surveys/${surveyId}`);
        if (!res.ok) throw new Error("Survey not found");
        const data = await res.json();
        setSurvey(data);
      } catch (err) {
        console.error(err);
        setError("Failed to load survey");
      } finally {
        setLoading(false);
      }
    }
    loadSurvey();
  }, [surveyId]);

  async function submit() {
    if (!answer) return;
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(`/api/surveys/${surveyId}/responses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer }),
      });

      if (!res.ok) throw new Error("Failed to submit");

      setSubmitted(true);

      setTimeout(() => {
        window.parent.postMessage(
          { type: "oneq-resize", height: document.body.scrollHeight },
          "*"
        );
      }, 50);
    } catch (err) {
      console.error(err);
      setError("Failed to submit response. Please try again.");
      setSubmitting(false);
    }
  }

  if (loading)
    return (
      <div className="flex items-center justify-center h-screen text-gray-600">
        Loading survey…
      </div>
    );

  if (error && !survey)
    return (
      <div className="flex items-center justify-center h-screen text-red-600">
        {error}
      </div>
    );

  if (!survey)
    return (
      <div className="flex items-center justify-center h-screen text-gray-600">
        Survey not found
      </div>
    );

  if (submitted)
    return (
      <div className="flex items-center justify-center h-screen p-6 bg-gray-50">
        <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center shadow-lg max-w-2xl w-full">
          <div className="text-4xl mb-2 text-green-800">✓</div>
          <div className="font-bold text-green-800 mb-2 text-xl">
            Thanks for responding!
          </div>
          <div className="text-gray-600 text-base">
            Your response has been recorded.
          </div>
        </div>
      </div>
    );

  const renderOptions = () => {
    if (survey.type === "yesno") {
      return (
        <div className="flex gap-4 justify-center">
          {["Yes", "No"].map((v) => (
            <Button
              key={v}
              variant={answer === v.toLowerCase() ? "default" : "outline"}
              size="lg"
              onClick={() => setAnswer(v.toLowerCase())}
              className="flex-1"
            >
              {v}
            </Button>
          ))}
        </div>
      );
    }

    if (survey.type === "multiple" && survey.options?.length) {
      return (
        <div className="flex flex-col gap-3 w-full max-w-2xl mx-auto">
          {survey.options.map((o: string) => (
            <Button
              key={o}
              variant={answer === o ? "default" : "outline"}
              size="lg"
              onClick={() => setAnswer(o)}
              className="w-full"
            >
              {o}
            </Button>
          ))}
        </div>
      );
    }

    if (survey.type === "rating") {
      const max = survey.range || 5;
      return (
        <div className="flex gap-4 justify-center">
          {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
            <Button
              key={n}
              variant={answer === String(n) ? "default" : "outline"}
              size="lg"
              onClick={() => setAnswer(String(n))}
            >
              {n}
            </Button>
          ))}
        </div>
      );
    }

    if (survey.type === "emoji" && survey.emojis?.length) {
      return (
        <div className="flex gap-4 justify-center">
          {survey.emojis.map((e: string) => (
            <Button
              key={e}
              variant={answer === e ? "default" : "outline"}
              size="lg"
              onClick={() => setAnswer(e)}
              className="text-4xl"
            >
              {e}
            </Button>
          ))}
        </div>
      );
    }

    if (survey.type === "text") {
      return (
        <Textarea
          value={answer}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
            setAnswer(e.target.value)
          }
          placeholder="Type your answer…"
          className="resize-none max-w-2xl mx-auto w-full"
          onKeyDown={(e) => e.key === "Enter" && answer && submit()}
        />
      );
    }

    return <div className="text-gray-500">No options available</div>;
  };

  return (
    <div className="min-h-screen w-full bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white shadow-lg rounded-xl p-8 w-full max-w-3xl space-y-6">
        <div className="text-2xl font-semibold text-center">{survey.question}</div>
        {renderOptions()}
        <Button
          onClick={submit}
          disabled={!answer || submitting}
          className="w-full mt-4"
          size="lg"
        >
          {submitting ? "Submitting…" : "Submit"}
        </Button>
        <div className="text-xs text-gray-500 mt-2 text-center">
          Powered by OneQ
        </div>
      </div>
    </div>
  );
}
