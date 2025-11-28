'use client';

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

        // Convert Postgres text[] to JS array if needed
        if (data.type === "multiple" && data.options && typeof data.options === "string") {
          data.options = data.options.replace(/^{|}$/g, "").split(",");
        }
        console.log(data + data.type + data.options + data.color)

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
    return <div className="flex items-center justify-center h-screen text-gray-600">Loading survey…</div>;

  if (error && !survey)
    return <div className="flex items-center justify-center h-screen text-red-600">{error}</div>;

  if (!survey)
    return <div className="flex items-center justify-center h-screen text-gray-600">Survey not found</div>;

  const theme = survey.color || "#6366f1"; // fallback indigo

  if (submitted)
    return (
      <div className="flex items-center justify-center h-screen p-6 bg-gray-50">
        <div
          className="rounded-lg p-8 text-center shadow-lg max-w-2xl w-full border"
          style={{ borderColor: theme, backgroundColor: theme + "15" }}
        >
          <div className="text-4xl mb-2" style={{ color: theme }}>✓</div>
          <div className="font-bold mb-2 text-xl" style={{ color: theme }}>Thanks for responding!</div>
          <div className="text-gray-700 text-base">Your response has been recorded.</div>
        </div>
      </div>
    );

  const themedButton = (isSelected: boolean) =>
    isSelected
      ? { backgroundColor: theme, color: "white", borderColor: theme }
      : { borderColor: theme, color: theme };

  const renderOptions = () => {
    if (survey.type === "yesno") {
      return (
        <div className="flex gap-4 justify-center">
          {["Yes", "No"].map((v) => (
            <Button
              key={v}
              size="lg"
              onClick={() => setAnswer(v.toLowerCase())}
              style={themedButton(answer === v.toLowerCase())}
              className="flex-1 border-2"
              variant="outline"
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
              size="lg"
              onClick={() => setAnswer(o)}
              style={themedButton(answer === o)}
              className="w-full border-2"
              variant="outline"
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
              size="lg"
              onClick={() => setAnswer(String(n))}
              style={themedButton(answer === String(n))}
              className="border-2"
              variant="outline"
            >
              {n}
            </Button>
          ))}
        </div>
      );
    }

    if (survey.type === "emoji") {
      const emojis = survey.emojis?.length ? survey.emojis : ["😡", "😕", "😐", "🙂", "🤩"];
      return (
        <div className="flex gap-4 justify-center">
          {emojis.map((e) => (
            <Button
              key={e}
              size="lg"
              onClick={() => setAnswer(e)}
              style={themedButton(answer === e)}
              className="text-4xl border-2"
              variant="outline"
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
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setAnswer(e.target.value)}
          placeholder="Type your answer…"
          className="resize-none max-w-2xl mx-auto w-full border-2"
          style={{ borderColor: theme }}
          onKeyDown={(e) => e.key === "Enter" && answer && submit()}
        />
      );
    }

    return <div className="text-gray-500 text-center">No options available</div>;
  };

  return (
    <div className="min-h-screen w-full bg-gray-50 flex items-center justify-center p-6">
      <div
        className="bg-white shadow-lg rounded-xl p-8 w-full max-w-3xl space-y-6 border"
        style={{ borderColor: theme + "40" }}
      >
        <div className="text-2xl font-semibold text-center" style={{ color: theme }}>
          {survey.question}
        </div>

        {renderOptions()}

        <Button
          onClick={submit}
          disabled={!answer || submitting}
          size="lg"
          className="w-full"
          style={{ backgroundColor: theme, color: "white" }}
        >
          {submitting ? "Submitting…" : "Submit"}
        </Button>

        <div className="text-xs mt-2 text-center text-gray-500">Powered by OneQ</div>
      </div>
    </div>
  );
}
