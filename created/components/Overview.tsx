"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
      // sort by created_at
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

  // refresh responses for one survey
  async function refreshSurveyResponses(surveyId: string) {
    setLoadingSurveys(prev => new Set(prev).add(surveyId));
    try {
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
    } catch (err) {
      console.error("Failed refreshing responses:", err);
      alert("Failed to refresh responses. See console.");
    } finally {
      setLoadingSurveys(prev => {
        const next = new Set(prev);
        next.delete(surveyId);
        return next;
      });
    }
  }

  // open stats dialog and refresh responses for it
  async function openStatsDialog(survey: any) {
    setSelectedSurvey(survey);
    setStatsDialogOpen(true);
    await refreshSurveyResponses(survey.id);
  }

  // delete survey & responses
  async function handleDelete(surveyId: string) {
    if (!confirm("Delete this survey and all its responses?")) return;
    setDeleting(true);
    try {
      await deleteResponses(surveyId);
      await deleteSurveys(projectId, surveyId);
      // update local state
      setSurveys(prev => prev.filter(s => s.id !== surveyId));
      setResponsesCounts(prev => {
        const n = { ...prev };
        delete n[surveyId];
        return n;
      });
      setTextResponses(prev => {
        const n = { ...prev };
        delete n[surveyId];
        return n;
      });
      setStatsDialogOpen(false);
      setSelectedSurvey(null);
    } catch (err) {
      console.error(err);
      alert("Failed to delete. See console.");
    } finally {
      setDeleting(false);
    }
  }

  // copy helper
  function copy(text: string, field: string) {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1600);
  }

  // utility: convert counts record into chart-friendly data array
  const toChartData = (countsRecord: Record<string, number> | undefined) => {
    if (!countsRecord) return [];
    return Object.entries(countsRecord).map(([name, value]) => ({ name, value }));
  };

  // text responses ordered getter
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
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Project Overview</h1>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setOrderAsc(!orderAsc)}
          >
            Sort by Date {orderAsc ? "↑" : "↓"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => loadSurveys()}
          >
            Refresh All
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-7xl">
        {surveys.length === 0 && <p className="text-gray-500 col-span-2">No surveys created yet.</p>}

        {surveys.map((survey) => {
          const isLoading = loadingSurveys.has(survey.id);
          const totalResponses = survey.type === "text"
            ? (textResponses[survey.id]?.length || 0)
            : Object.values(responsesCounts[survey.id] || {}).reduce((s, n) => s + n, 0);

          return (
            <div key={survey.id} className="relative">
              <Card className="shadow-sm">
                {/* floating loader in card content when refreshing */}
                {isLoading && (
                  <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-10 rounded">
                    <Loader2 className="animate-spin" />
                  </div>
                )}

                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 pr-4">
                      <CardTitle className="text-lg">{survey.question}</CardTitle>
                      <p className="text-xs text-gray-500 mt-1">
                        {survey.type} • {new Date(survey.created_at).toLocaleDateString()}
                      </p>
                      {totalResponses > 0 && <p className="text-sm text-blue-600 mt-1">{totalResponses} {totalResponses === 1 ? "response" : "responses"}</p>}
                    </div>

                    <div className="ml-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal size={18} />
                        </Button>
                      </DropdownMenuTrigger>

                      <DropdownMenuContent align="end" className="w-32 p-1">
                        <DropdownMenuItem
                          className="flex items-center gap-2 text-red-600 hover:bg-red-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(survey.id);
                          }}
                        >
                          <Trash size={16} /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => openStatsDialog(survey)}
                    >
                      View Stats
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => refreshSurveyResponses(survey.id)}
                      disabled={isLoading}
                    >
                      {isLoading ? <Loader2 className="animate-spin mr-2" /> : null}
                      Refresh
                    </Button>

                    <Button
                      variant="secondary"
                      size="sm"
                      className="flex-1"
                      asChild
                    >
                      <a href={`/survey/${survey.id}`} target="_blank" rel="noopener noreferrer">Open Live</a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>

      {/* Stats Dialog */}
      <Dialog open={statsDialogOpen} onOpenChange={setStatsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedSurvey?.question ?? "Survey"}</DialogTitle>
            <p className="text-sm text-gray-500">
              Type: {selectedSurvey?.type} • Created: {selectedSurvey ? new Date(selectedSurvey.created_at).toLocaleString() : "-"}
            </p>
          </DialogHeader>

          <div className="p-2">
            <Tabs defaultValue="stats" className="w-full">
              <div className="flex items-center justify-between mb-2">
                <div />
              </div>

              <TabsList className="grid grid-cols-2 gap-2 mb-3">
                <TabsTrigger value="stats">Stats</TabsTrigger>
                <TabsTrigger value="embeds">Embed Codes</TabsTrigger>
              </TabsList>

              {/* STATS TAB */}
              <TabsContent value="stats">
                {selectedSurvey && (
                  <>
                    {/* TEXT TYPE */}
                    {selectedSurvey.type === "text" ? (
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <div className="font-semibold">Free Text Responses ({(textResponses[selectedSurvey.id] || []).length})</div>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={() => setTextResponseOrder(prev => prev === "asc" ? "desc" : "asc")}>
                              <ArrowUpDown size={14} className="mr-1" />
                              {textResponseOrder === "asc" ? "Oldest" : "Newest"}
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => refreshSurveyResponses(selectedSurvey.id)}>
                              Refresh
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-2 max-h-96 overflow-y-auto">
                          {getOrderedTextResponses(selectedSurvey.id).map((t, idx) => (
                            <div key={idx} className="bg-gray-50 border border-gray-200 rounded p-3 text-sm">
                              <div className="text-gray-800">{t}</div>
                            </div>
                          ))}
                          {(!textResponses[selectedSurvey.id] || textResponses[selectedSurvey.id].length === 0) && <p className="text-gray-500">No responses yet.</p>}
                        </div>
                      </div>
                    ) : (
                      // NON-TEXT: show chart + counts list
                      <div>
                        <div className="flex items-center justify-between">
                          <div className="font-semibold">Responses</div>
                          <div className="flex items-center gap-2">
                            <div className="border-t flex gap-2">
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(selectedSurvey.id)} disabled={deleting}>
                        {deleting ? <Loader2 className="animate-spin mr-2" /> : <Trash2 className="mr-2" />}
                        Delete Survey
                      </Button>
                    </div>
                            <Button variant="outline" size="sm" onClick={() => refreshSurveyResponses(selectedSurvey.id)}>Refresh</Button>
                          </div>
                        </div>

                        <ul className="mt-4 space-y-2">
                          {Object.entries(responsesCounts[selectedSurvey.id] || {})
                            .sort(([, a], [, b]) => (b as number) - (a as number))
                            .map(([answer, count]) => (
                              <li key={answer} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                                <span className="font-medium">{answer}</span>
                                <span className="text-gray-600">{count} {count === 1 ? "vote" : "votes"}</span>
                              </li>
                            ))}
                          {(!responsesCounts[selectedSurvey.id] || Object.keys(responsesCounts[selectedSurvey.id] || {}).length === 0) && <p className="text-gray-500">No responses yet.</p>}
                        </ul>

                        <div style={{ width: "100%", height: 260 }}>
                          <ResponsiveContainer>
                            <BarChart data={toChartData(responsesCounts[selectedSurvey.id])}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="name" />
                              <YAxis allowDecimals={false} />
                              <Tooltip />
                              <Bar dataKey="value" fill="#667eea" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>

                        
                      </div>
                    )}

                    {/* actions */}
                    
                  </>
                )}
              </TabsContent>

              {/* EMBEDS TAB */}
              <TabsContent value="embeds">
                {selectedSurvey ? (
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <div className="font-semibold">Direct Link</div>
                        <Button size="sm" variant="outline" onClick={() => copy(selectedSurvey.survey_link || "", "link")}>
                          {copiedField === "link" ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
                        </Button>
                      </div>
                      <pre className="bg-gray-100 p-3 rounded text-xs font-mono overflow-x-auto">{selectedSurvey.survey_link}</pre>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <div className="font-semibold">iFrame</div>
                        <Button size="sm" variant="outline" onClick={() => copy(selectedSurvey.survey_iframe || "", "iframe")}>
                          {copiedField === "iframe" ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
                        </Button>
                      </div>
                      <pre className="bg-gray-100 p-3 rounded text-xs font-mono overflow-x-auto">{selectedSurvey.survey_iframe}</pre>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <div className="font-semibold">Script</div>
                        <Button size="sm" variant="outline" onClick={() => copy(selectedSurvey.survey_script || "", "script")}>
                          {copiedField === "script" ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
                        </Button>
                      </div>
                      <pre className="bg-gray-100 p-3 rounded text-xs font-mono overflow-x-auto">{selectedSurvey.survey_script}</pre>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <div className="font-semibold">Widget</div>
                        <Button size="sm" variant="outline" onClick={() => copy(selectedSurvey.survey_widget || "", "widget")}>
                          {copiedField === "widget" ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
                        </Button>
                      </div>
                      <pre className="bg-gray-100 p-3 rounded text-xs font-mono overflow-x-auto">{selectedSurvey.survey_widget}</pre>
                    </div>

                  </div>
                ) : (
                  <p className="text-gray-500">No survey selected.</p>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
