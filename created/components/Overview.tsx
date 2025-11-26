// Updated Overview component with charts only for non-text survey types
// (Full component rewritten with requested behavior)

"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Copy, Check, MoreHorizontal, Trash2, Loader2, ArrowUpDown, Trash } from "lucide-react";
import { getSurveys, deleteSurveys } from "@/lib/supabaseSurveys";
import { getSurveyResponses, deleteResponses } from "@/lib/supabaseResponses";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";

interface OverviewProps {
  projectId: string;
}

export default function Overview({ projectId }: OverviewProps) {
  const [surveys, setSurveys] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingSurveys, setLoadingSurveys] = useState<Set<string>>(new Set());
  const [responsesCounts, setResponsesCounts] = useState<Record<string, Record<string, number>>>({});
  const [textResponses, setTextResponses] = useState<Record<string, string[]>>({});
  const [statsDialogOpen, setStatsDialogOpen] = useState(false);
  const [selectedSurvey, setSelectedSurvey] = useState<any | null>(null);
  const [orderAsc, setOrderAsc] = useState(false);
  const [textResponseOrder, setTextResponseOrder] = useState<"asc" | "desc">("desc");
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!projectId) return;
    loadSurveys();
  }, [projectId, orderAsc]);

  async function loadSurveys() {
    setLoading(true);
    try {
      let data = await getSurveys(projectId);
      if (!Array.isArray(data)) data = [];

      data = data.sort((a: any, b: any) => {
        const aT = new Date(a.created_at).getTime();
        const bT = new Date(b.created_at).getTime();
        return orderAsc ? aT - bT : bT - aT;
      });

      setSurveys(data);
      loadAllResponses(data);
    } catch (err) {
      setSurveys([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadAllResponses(surveyList: any[]) {
    const counts: Record<string, Record<string, number>> = {};
    const texts: Record<string, string[]> = {};

    for (const s of surveyList) {
      const res = await getSurveyResponses(s.id, "desc");

      if (s.type === "text") {
        texts[s.id] = (res || []).map((r: any) => r.answer ?? "");
      } else {
        const agg: Record<string, number> = {};
        (res || []).forEach((r: any) => {
          const a = String(r.answer ?? "");
          agg[a] = (agg[a] || 0) + 1;
        });
        counts[s.id] = agg;
      }
    }

    setResponsesCounts(counts);
    setTextResponses(texts);
  }

  async function refreshSurveyResponses(surveyId: string) {
    setLoadingSurveys(prev => new Set(prev).add(surveyId));
    const survey = surveys.find(s => s.id === surveyId);
    if (!survey) return;

    const res = await getSurveyResponses(surveyId, "desc");

    if (survey.type === "text") {
      setTextResponses(prev => ({ ...prev, [surveyId]: (res || []).map((r: any) => r.answer ?? "") }));
    } else {
      const agg: Record<string, number> = {};
      (res || []).forEach((r: any) => {
        const a = String(r.answer ?? "");
        agg[a] = (agg[a] || 0) + 1;
      });
      setResponsesCounts(prev => ({ ...prev, [surveyId]: agg }));
    }

    setLoadingSurveys(prev => {
      const next = new Set(prev);
      next.delete(surveyId);
      return next;
    });
  }

  async function openStatsDialog(survey: any) {
    setSelectedSurvey(survey);
    setStatsDialogOpen(true);
    await refreshSurveyResponses(survey.id);
  }

  function copy(text: string, field: string) {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1600);
  }

  const toChartData = (countsRecord: Record<string, number> | undefined) => {
    if (!countsRecord) return [];
    return Object.entries(countsRecord).map(([name, value]) => ({ name, value }));
  };

  const getOrderedTextResponses = (surveyId: string) => {
    const arr = textResponses[surveyId] || [];
    return textResponseOrder === "asc" ? [...arr].reverse() : arr;
  };

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-4">Project Overview</h1>
        <p className="text-gray-500">Loading surveys…</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Project Overview</h1>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Total Surveys</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">
            {surveys.length}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Total Responses</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">
            {surveys.reduce((sum, s) => {
              const count = s.type === "text"
                ? (textResponses[s.id]?.length || 0)
                : Object.values(responsesCounts[s.id] || {}).reduce((a, b) => a + b, 0);
              return sum + count;
            }, 0)}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-7xl">
        {surveys.map((survey) => {
          const isLoading = loadingSurveys.has(survey.id);
          const totalResponses = survey.type === "text"
            ? (textResponses[survey.id]?.length || 0)
            : Object.values(responsesCounts[survey.id] || {}).reduce((s, n) => s + n, 0);

          return (
            <Card key={survey.id} className="shadow-sm">
              <CardHeader>
                <CardTitle>{survey.question}</CardTitle>
              </CardHeader>
              <CardContent>
                {survey.type !== "text" && (
                  <div style={{ width: "100%", height: 200 }}>
                    <ResponsiveContainer>
                      <BarChart data={toChartData(responsesCounts[survey.id])}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="value" fill="#667eea" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 w-full"
                  onClick={() => openStatsDialog(survey)}
                >
                  View Stats
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
