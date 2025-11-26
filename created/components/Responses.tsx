// Responses Page with delete per-response, delete-all, sorting, and support for all survey types

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

interface ResponsesPageProps {
  projectId: string;
}

export default function Response({ projectId }: ResponsesPageProps) {
  const [surveys, setSurveys] = useState<any[]>([]);
  const [responses, setResponses] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [sorting, setSorting] = useState<Record<string, "asc" | "desc">>({});
  const [loadingSurvey, setLoadingSurvey] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!projectId) return;
    load();
  }, [projectId]);

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

  async function toggleSort(surveyId: string) {
    const current = sorting[surveyId] || "desc";
    const next = current === "desc" ? "asc" : "desc";
    setSorting((prev) => ({ ...prev, [surveyId]: next }));
  }

  async function deleteAll(surveyId: string) {
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

  if (loading) {
    return (
      <div className="p-6 text-gray-500">
        <Loader2 className="animate-spin inline-block mr-2" /> Loading responses…
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold">All Responses</h1>

      {surveys.map((survey) => {
        const list = responses[survey.id] || [];
        const direction = sorting[survey.id] || "desc";
        const sortedList = sorted(list, direction);
        const busy = loadingSurvey.has(survey.id);

        return (
          <Card key={survey.id} className="shadow-sm border">
            <CardHeader className="flex flex-col gap-2">
              <CardTitle className="text-xl font-semibold">
                {survey.question}
              </CardTitle>

              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleSort(survey.id)}
                  className="flex items-center gap-2"
                >
                  <ArrowUpDown className="w-4 h-4" /> {direction.toUpperCase()}
                </Button>

                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => deleteAll(survey.id)}
                  disabled={busy}
                  className="flex items-center gap-2"
                >
                  {busy && <Loader2 className="w-4 h-4 animate-spin" />} <Trash2 className="w-4 h-4" /> Delete All
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
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