'use client'

import { useEffect, useState } from "react";
import { deleteSurveys, getSurveys } from "@/lib/supabaseSurveys";
import { getSurveyResponses } from "@/lib/supabaseResponses";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Trash2 } from "lucide-react";

interface OverviewProps {
  projectId: string;
}

export default function Overview({ projectId }: OverviewProps) {
  const [surveys, setSurveys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [responsesCounts, setResponsesCounts] = useState<Record<string, Record<string, number>>>({});
  const [orderAsc, setOrderAsc] = useState(true);

  // Load surveys
  useEffect(() => {
    async function load() {
      if (!projectId) return;

      setLoading(true);
      try {
        let data = await getSurveys(projectId);

        // Sort surveys by created_at
        data = data.sort((a: any, b: any) => {
          const dateA = new Date(a.created_at).getTime();
          const dateB = new Date(b.created_at).getTime();
          return orderAsc ? dateA - dateB : dateB - dateA;
        });

        setSurveys(data || []);
      } catch (error) {
        console.error("Error loading surveys:", error);
        setSurveys([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [projectId, orderAsc]);

  // Load responses counts for each survey
  useEffect(() => {
    async function loadResponsesCounts() {
      const allCounts: Record<string, Record<string, number>> = {};

      for (const survey of surveys) {
        const responses = await getSurveyResponses(survey.id);
        const counts: Record<string, number> = {};

        responses.forEach((r: any) => {
          counts[r.answer] = (counts[r.answer] || 0) + 1;
        });

        allCounts[survey.id] = counts;
      }

      setResponsesCounts(allCounts);
    }

    if (surveys.length > 0) loadResponsesCounts();
  }, [surveys]);

  async function handleDelete(surveyId: string) {
    if (!confirm("Delete this survey?")) return;

    try {
      await deleteSurveys(projectId, surveyId);
      const data = await getSurveys(projectId);
      setSurveys(data || []);
      setMenuOpen(null);
    } catch (e) {
      console.error(e);
      alert("Error deleting survey.");
    }
  }

  // Close menu if clicked outside
  useEffect(() => {
    function handleClickOutside() {
      setMenuOpen(null);
    }

    if (menuOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [menuOpen]);

  if (loading) return <p className="p-6 text-gray-500">Loading surveys...</p>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Project Overview</h1>

      <Button
        variant="outline"
        size="sm"
        onClick={() => setOrderAsc(!orderAsc)}
      >
        Sort by Date {orderAsc ? "Descending" : "Ascending"}
      </Button>

      <Card className="shadow-sm max-w-5xl w-full">
        <CardHeader>
          <CardTitle>Surveys in this Project</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {surveys.length === 0 && <p className="text-gray-500">No surveys created yet.</p>}

          {surveys.map((survey) => (
            <Collapsible key={survey.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{survey.question}</h3>
                  <p className="text-sm text-gray-500">
                    Type: {survey.type} | Created: {new Date(survey.created_at).toLocaleString()}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <CollapsibleTrigger asChild>
                    <Button variant="outline">View Stats</Button>
                  </CollapsibleTrigger>

                  <div className="relative">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpen(menuOpen === survey.id ? null : survey.id);
                      }}
                    >
                      <MoreHorizontal size={18} />
                    </Button>

                    {menuOpen === survey.id && (
                      <div className="absolute right-0 mt-2 w-28 bg-white border rounded shadow-lg z-10">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start gap-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(survey.id);
                          }}
                        >
                          <Trash2 size={16} />
                          Delete
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <CollapsibleContent className="mt-4 border-t pt-4 space-y-3">
                <p className="text-sm text-gray-600">
                  <strong>Survey ID:</strong> {survey.id}
                </p>

                {/* Responses counts */}
                {responsesCounts[survey.id] && Object.keys(responsesCounts[survey.id]).length > 0 ? (
                  <div className="mt-2 border-t pt-2 text-sm text-gray-700 space-y-1">
                    <p className="font-semibold">Responses:</p>
                    <ul className="list-disc list-inside">
                      {Object.entries(responsesCounts[survey.id]).map(([answer, count]) => (
                        <li key={answer}>
                          {answer}: {count}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm mt-2">No responses yet.</p>
                )}

                <Button className="mt-2" variant="secondary" asChild>
                  <a
                    href={`/survey/${survey.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open Live Survey
                  </a>
                </Button>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
