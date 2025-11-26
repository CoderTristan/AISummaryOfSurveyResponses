"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2, ArrowUpDown } from "lucide-react";
import { getSurveys } from "@/lib/supabaseSurveys";
import {
  getSurveyResponses,
  deleteResponses,
  deleteSingleResponse,
} from "@/lib/supabaseResponses";
import { getBalance } from "@/lib/userData";

interface ResponsesPageProps {
    projectId: string;
  searchParams?: any;
}

export default function Response({projectId}: ResponsesPageProps) {
  const [surveys, setSurveys] = useState<any[]>([]);
  const [responses, setResponses] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [sorting, setSorting] = useState<Record<string, "asc" | "desc">>({});
  const [loadingSurvey, setLoadingSurvey] = useState<Set<string>>(new Set());
  const [generating, setGenerating] = useState<Set<string>>(new Set());
  const [balance, setBalance] = useState<number | null>(null);
  const [costPer1k, setCostPer1k] = useState<number>(0.02); // default

  // Add this inside your component, alongside other functions:
async function refreshSurvey(surveyId: string) {
  setLoadingSurvey((prev) => new Set(prev).add(surveyId));
  const r = await getSurveyResponses(surveyId, "desc");
  setResponses((prev) => ({ ...prev, [surveyId]: Array.isArray(r) ? r : [] }));
  setLoadingSurvey((prev) => {
    const next = new Set(prev);
    next.delete(surveyId);
    return next;
  });
}


  useEffect(() => {
    load();
    fetchBalance();
  }, []);

  // ⭐ UPDATED: load tokens directly from Supabase
  async function fetchBalance() {
    try {
      const data = await getBalance()

      setBalance(typeof data?.balance === "number" ? data.balance : 0);
      setCostPer1k(0.02); // unchanged default
    } catch (e) {
      console.warn("balance fetch failed", e);
    }
  }

  async function load() {
    setLoading(true);
    const s = await getSurveys(projectId);
    const surveysArray = Array.isArray(s) ? s : [];
    setSurveys(surveysArray);

    const resMap: Record<string, any[]> = {};
    for (const survey of surveysArray) {
      const r = await getSurveyResponses(survey.id, "desc");
      resMap[survey.id] = Array.isArray(r) ? r : [];
    }

    setResponses(resMap);
    setLoading(false);
  }

  function sorted(list: any[], dir: "asc" | "desc") {
    return [...list].sort((a, b) => {
      const t1 = new Date(a.created_at).getTime();
      const t2 = new Date(b.created_at).getTime();
      return dir === "asc" ? t1 - t2 : t2 - t1;
    });
  }

  function estimateTokensForText(text: string) {
    if (!text) return 0;
    const words = text.trim().split(/\s+/).length;
    return Math.max(1, Math.ceil(words * 1.5));
  }

  function estimateCostForTokens(tokens: number) {
    return (tokens / 1000) * costPer1k;
  }

  async function toggleSort(surveyId: string) {
    const current = sorting[surveyId] || "desc";
    const next = current === "desc" ? "asc" : "desc";
    setSorting((prev) => ({ ...prev, [surveyId]: next }));
  }

  async function deleteAll(surveyId: string) {
    if (!confirm("Delete ALL responses for this survey? This cannot be undone.")) return;
    setLoadingSurvey((prev) => new Set(prev).add(surveyId));
    await deleteResponses(surveyId);
    setResponses((prev) => ({ ...prev, [surveyId]: [] }));
    setLoadingSurvey((prev) => {
      const next = new Set(prev);
      next.delete(surveyId);
      return next;
    });
  }

  async function deleteOne(surveyId: string, responseId: string) {
    if (!confirm("Delete this response?")) return;
    setLoadingSurvey((prev) => new Set(prev).add(surveyId));
    await deleteSingleResponse(responseId);
    setResponses((prev) => ({
      ...prev,
      [surveyId]: prev[surveyId].filter((r) => r.id !== responseId),
    }));
    setLoadingSurvey((prev) => {
      const next = new Set(prev);
      next.delete(surveyId);
      return next;
    });
  }

  // Generate AI summary for a single survey
  // Generate AI summary for a single survey
async function generateSummary(surveyId: string, suppressAlert = false) {
  const survey = surveys.find((s) => s.id === surveyId);
  if (!survey) return false;

  const list = responses[surveyId] || [];
  const joinedAnswers = list.map((r) => String(r.answer || "")).join("\n");
  const promptEstimate = `${survey.question}\n\n${joinedAnswers}`;
  const promptTokens = estimateTokensForText(promptEstimate);
  const expectedCompletionTokens = 350;
  const totalEstimate = promptTokens + expectedCompletionTokens;
  const estCost = estimateCostForTokens(totalEstimate);

  if (balance === null || balance < estCost) {
    if (!suppressAlert) {
      alert(`Not enough tokens to generate AI summary.\nRequired: ${estCost.toFixed(4)}, Available: ${balance ?? 0}`);
    }
    return false;
  }

  setGenerating((prev) => new Set(prev).add(surveyId));
  try {
    const res = await fetch(`/api/surveys/${surveyId}/generate-summary`, { method: "POST" });
    if (!res.ok) {
      if (!suppressAlert) {
        const t = await res.text();
        alert("Generate failed: " + t);
      }
      return false;
    }

    const data = await res.json();
    if (data?.generated) {
      const { summary, sentiment, actions } = data.generated;
      setSurveys((prev) =>
        prev.map((s) => (s.id === surveyId ? { ...s, ai_summary: summary, ai_sentiment: sentiment, ai_actions: actions } : s))
      );
    }

    // Refresh token balance after successful generation
    await fetchBalance();
    return true;
  } catch (err) {
    console.error("generate error", err);
    if (!suppressAlert) alert("Generation failed — see console");
    return false;
  } finally {
    setGenerating((prev) => {
      const next = new Set(prev);
      next.delete(surveyId);
      return next;
    });
  }
}



  async function generateAll() {
  if (!confirm("Generate AI summaries for ALL surveys? This will consume tokens.")) return;

  let failed = false;
  for (const s of surveys) {
    const ok = await generateSummary(s.id, true); // suppressAlert = true
    if (!ok) failed = true;
  }

  if (failed) {
    alert("Some surveys could not be generated due to insufficient tokens.");
  }
}

  if (loading) {
    return (
      <div className="p-6 text-gray-500">
        <Loader2 className="animate-spin inline-block mr-2" /> Loading responses…
      </div>
    );
  }

  const totalSurveys = surveys.length;
  const totalResponses = Object.values(responses).reduce((sum, arr) => sum + (arr?.length || 0), 0);

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">All Responses</h1>

        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-600 mr-4">
            <div>Total surveys: <strong>{totalSurveys}</strong></div>
            <div>Total responses: <strong>{totalResponses}</strong></div>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-sm text-gray-700 mr-2">
              Tokens balance: <strong>{balance === null ? "—" : `${balance}`}</strong>
            </div>
            <Button variant="outline" size="sm" onClick={load}>
  Refresh All
</Button>
            <Button variant="outline" size="sm" onClick={generateAll}>
              Generate All
            </Button>
          </div>
        </div>
      </div>

      {surveys.map((survey) => {
        const list = responses[survey.id] || [];
        const direction = sorting[survey.id] || "desc";
        const sortedList = sorted(list, direction);
        const busy = loadingSurvey.has(survey.id);
        const isGenerating = generating.has(survey.id);

        const joinedAnswers = (list || []).map(r => String(r.answer || "")).join("\n");
        const promptEstimate = `${survey.question}\n\n${joinedAnswers}`;
        const promptTokens = estimateTokensForText(promptEstimate);
        const expectedCompletionTokens = 350;
        const totalEstimate = promptTokens + expectedCompletionTokens;

        return (
          <Card key={survey.id} className="shadow-sm border">
            <CardHeader className="flex flex-col gap-2">
              <div className="flex items-start justify-between w-full">
                <div>
                  <CardTitle className="text-xl font-semibold">{survey.question}</CardTitle>
                  <div className="text-xs text-gray-500">{survey.type} • { (responses[survey.id] || []).length } responses</div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <div className="text-xs text-gray-600">Estimate: {totalEstimate} tokens</div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => toggleSort(survey.id)} className="flex items-center gap-2">
                      <ArrowUpDown className="w-4 h-4" /> {direction.toUpperCase()}
                    </Button>

                    <Button variant="ghost" size="sm" onClick={() => refreshSurvey(survey.id)} disabled={loadingSurvey.has(survey.id)}>
  {loadingSurvey.has(survey.id) ? <Loader2 className="animate-spin w-4 h-4" /> : "Refresh"}
</Button>

                    <Button variant="ghost" size="sm" onClick={() => generateSummary(survey.id)} disabled={isGenerating}>
                      {isGenerating ? <Loader2 className="animate-spin w-4 h-4" /> : "Generate AI Summary"}
                    </Button>

                    <Button variant="destructive" size="sm" onClick={() => deleteAll(survey.id)} disabled={busy}>
                      {busy ? <Loader2 className="animate-spin w-4 h-4" /> : <><Trash2 className="w-4 h-4" /> Delete All</>}
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {survey.ai_summary ? (
                <div className="p-3 bg-gray-50 border rounded">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">AI Summary</div>
                    <div className="text-sm text-gray-600">Sentiment: <strong>{(survey.ai_sentiment ?? 0).toFixed(2)}</strong></div>
                  </div>
                  <div className="mt-2 text-sm text-gray-800 whitespace-pre-wrap">{survey.ai_summary}</div>
                </div>
              ) : (
                <div className="text-sm text-gray-500">No AI summary yet</div>
              )}

              {sortedList.length === 0 && (
                <p className="text-gray-500">No responses yet.</p>
              )}

              {sortedList.map((resp) => (
                <div
                  key={resp.id}
                  className="p-4 border rounded-lg flex justify-between items-start"
                >
                  <div className="w-full">
                    {survey.type === "text" ? (
                      <p className="text-gray-800 whitespace-pre-wrap">{resp.answer}</p>
                    ) : (
                      <div>
                        <span className="text-gray-700 font-medium">Answer:</span> {String(resp.answer)}
                      </div>
                    )}
                    <div className="text-xs text-gray-400 mt-1">
                      {new Date(resp.created_at).toLocaleString()}
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteOne(survey.id, resp.id)}
                    aria-label="Delete response"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
