"use client";

import { useEffect, useState, useMemo } from "react";
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
import {
  getSurveys,
  deleteSurveys,
} from "@/lib/supabaseSurveys";
import {
  getSurveyResponses,
  deleteResponses,
} from "@/lib/supabaseResponses";
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
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import { updateProjectEmailFields } from "@/lib/supabaseProjects";

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
  const [emailSettings, setEmailSettings] = useState<any | null>(null);

  async function handleEmailUpdate(updates: any) {
    try {
      await updateProjectEmailFields(projectId, updates);
      setEmailSettings((prev: any) => ({ ...prev, ...updates }));
    } catch (err) {
      console.error("Failed to update notification settings", err);
      alert("Failed to update email settings.");
    }
  }

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
      console.error("Failed to load surveys:", err);
      setSurveys([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadAllResponses(surveyList: any[]) {
    const counts: Record<string, Record<string, number>> = {};
    const texts: Record<string, string[]> = {};
    for (const s of surveyList) {
      try {
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
      } catch (e) {
        console.error("Failed load responses for", s.id, e);
      }
    }
    setResponsesCounts(counts);
    setTextResponses(texts);
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Project Overview</h1>
      </div>

      {/* EMAIL SETTINGS AT TOP */}
      <Card className="border-2 shadow-sm mt-4 p-4">
        <h2 className="font-semibold text-xl mb-3">Email Report Settings</h2>

        <div className="flex items-center justify-between p-3 border rounded-lg bg-white">
          <div>
            <p className="font-medium">Enable Email Reports</p>
            <p className="text-xs text-gray-500">Receive periodic survey reports via email</p>
          </div>
          <Switch
            checked={emailSettings?.notify_enabled || false}
            onCheckedChange={val => handleEmailUpdate({ notify_enabled: val })}
          />
        </div>

        {emailSettings?.notify_enabled && (
          <div className="space-y-4 pl-4 border-l-2 border-primary/30 mt-4">
            <div className="flex items-center justify-between p-3 border rounded-lg bg-white">
              <div className="space-y-1">
                <Label className="font-medium">Report Frequency</Label>
                <div className="flex items-center gap-4 mt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Switch
                      checked={emailSettings?.report_frequency === "daily"}
                      onCheckedChange={val => handleEmailUpdate({ report_frequency: val ? "daily" : "weekly" })}
                    />
                    <span className="text-sm">{emailSettings?.report_frequency === "daily" ? "Daily" : "Weekly"}</span>
                  </label>
                </div>
              </div>
            </div>
            <div className="text-xs text-gray-500 p-2 bg-gray-50 rounded">
              Reports will be sent {emailSettings?.report_frequency === "daily" ? "every day" : "every week"} with survey statistics.
            </div>
          </div>
        )}
      </Card>

      {/* SURVEY GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-7xl">
        {surveys.length === 0 && <p className="text-gray-500 col-span-2">No surveys created yet.</p>}

        {surveys.map((survey) => {
          const totalResponses = survey.type === "text"
            ? (textResponses[survey.id]?.length || 0)
            : Object.values(responsesCounts[survey.id] || {}).reduce((s, n) => s + n, 0);

          return (
            <Card key={survey.id} className="shadow-sm p-4">
              <CardTitle>{survey.question}</CardTitle>
              <p className="text-xs text-gray-500 mt-1">{survey.type}</p>
              <p className="text-sm text-blue-600 mt-1">{totalResponses} responses</p>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
