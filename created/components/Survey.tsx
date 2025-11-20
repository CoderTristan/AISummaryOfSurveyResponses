"use client";

import { useEffect, useState } from "react";

interface PublicSurveyProps {
  surveyId: string;
}

export default function PublicSurvey({ surveyId }: PublicSurveyProps) {
  const [survey, setSurvey] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [answer, setAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadSurvey() {
      try {
        const res = await fetch(`/api/surveys/${surveyId}`);
        if (!res.ok) {
          throw new Error("Survey not found");
        }
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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ answer }),
      });

      if (!res.ok) {
        throw new Error("Failed to submit");
      }

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

  if (loading) {
    return (
      <div className="p-6 max-w-xl mx-auto mt-20 text-center">
        <p className="text-gray-600">Loading survey...</p>
      </div>
    );
  }

  if (error && !survey) {
    return (
      <div className="p-6 max-w-xl mx-auto mt-20 text-center">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!survey) {
    return (
      <div className="p-6 max-w-xl mx-auto mt-20 text-center">
        <p className="text-gray-600">Survey not found</p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="p-6 max-w-xl mx-auto mt-20 text-center">
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <p className="text-green-800 text-lg font-semibold">
            ✓ Thanks for responding!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-xl mx-auto mt-20">
      <h1 className="text-2xl font-bold mb-6">{survey.question}</h1>

      {/* YES / NO */}
      {survey.type === "yesno" && (
        <div className="space-x-3">
          <button
            onClick={() => setAnswer("yes")}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              answer === "yes"
                ? "bg-black text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Yes
          </button>
          <button
            onClick={() => setAnswer("no")}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              answer === "no"
                ? "bg-black text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            No
          </button>
        </div>
      )}

      {/* MULTIPLE CHOICE */}
      {survey.type === "multiple" && (
        <div className="space-y-3">
          {survey.options?.map((o: string) => (
            <button
              key={o}
              className={`w-full p-4 rounded-lg text-left font-medium transition-colors ${
                answer === o
                  ? "bg-black text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
              onClick={() => setAnswer(o)}
            >
              {answer === o && <span className="mr-2">✓</span>}
              {o}
            </button>
          ))}
        </div>
      )}

      {/* RATING 1–5 */}
      {survey.type === "rating" && (
        <div className="flex justify-center space-x-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              className={`w-12 h-12 rounded-lg font-bold transition-colors ${
                answer === String(n)
                  ? "bg-black text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
              onClick={() => setAnswer(String(n))}
            >
              {n}
            </button>
          ))}
        </div>
      )}

      {/* EMOJI PICKER */}
      {survey.type === "emoji" && (
        <div className="flex justify-center space-x-3">
          {["😡", "😕", "😐", "🙂", "🤩"].map((e) => (
            <button
              key={e}
              className={`text-4xl p-3 rounded-lg transition-all ${
                answer === e
                  ? "bg-black scale-110"
                  : "bg-gray-100 hover:bg-gray-200 hover:scale-105"
              }`}
              onClick={() => setAnswer(e)}
            >
              {e}
            </button>
          ))}
        </div>
      )}

      {/* DEFAULT TEXT INPUT */}
      {survey.type === "text" && (
        <input
          type="text"
          className="border border-gray-300 p-3 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
          placeholder="Type your answer..."
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && answer) {
              submit();
            }
          }}
        />
      )}

      {/* ERROR MESSAGE */}
      {error && (
        <p className="mt-4 text-red-600 text-sm text-center">{error}</p>
      )}

      {/* SUBMIT BUTTON */}
      <button
        onClick={submit}
        disabled={!answer || submitting}
        className={`mt-6 px-6 py-3 rounded-lg w-full font-semibold transition-colors ${
          !answer || submitting
            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
            : "bg-black text-white hover:bg-gray-800"
        }`}
      >
        {submitting ? "Submitting..." : "Submit"}
      </button>
    </div>
  );
}