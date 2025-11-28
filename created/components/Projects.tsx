'use client';

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Plus, MoreHorizontal, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { createProject, getUserProjects, deleteProject } from "@/lib/supabaseProjects";
import { deleteProjectsSurveys, getSurveys } from "@/lib/supabaseSurveys";
import { deleteAllProjectResponses, getSurveyResponses } from "@/lib/supabaseResponses";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { useSubscription } from "@/hooks/use-sub";
import { PLAN_LIMITS } from "@/lib/plans";

interface Project {
  id: string;
  name: string;
}

export default function Projects() {
  const { user } = useUser();
  const userId = user?.id || null;

  const [open, setOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectName, setProjectName] = useState("");
  const [loading, setLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [totalSurveys, setTotalSurveys] = useState(0);
  const [totalResponses, setTotalResponses] = useState(0);
  const [loadingTotals, setLoadingTotals] = useState(true);
const subscription = useSubscription();
const plan = subscription?.plan || "free";
const maxProjects = PLAN_LIMITS[plan.toLowerCase()]?.projects ?? 1;

  const router = useRouter();

  const fetchTotals = useCallback(async () => {
    if (!userId || projects.length === 0) {
      setLoadingTotals(false);
      return;
    }

    setLoadingTotals(true);
    try {
      let surveyCount = 0;
      let responseCount = 0;

      // Loop through all projects
      for (const project of projects) {
        try {
          // Get surveys for this project
          const surveys = await getSurveys(project.id);
          if (Array.isArray(surveys)) {
            surveyCount += surveys.length;

            // Get responses for each survey
            for (const survey of surveys) {
              try {
                const responses = await getSurveyResponses(survey.id, "desc");
                if (Array.isArray(responses)) {
                  responseCount += responses.length;
                }
              } catch (err) {
                console.error(`Failed to fetch responses for survey ${survey.id}:`, err);
              }
            }
          }
        } catch (err) {
          console.error(`Failed to fetch surveys for project ${project.id}:`, err);
        }
      }

      setTotalSurveys(surveyCount);
      setTotalResponses(responseCount);
    } catch (error) {
      console.error("Failed to fetch totals:", error);
    } finally {
      setLoadingTotals(false);
    }
  }, [userId, projects]);

  // Fetch projects
  const fetchProjects = useCallback(async () => {
    if (!userId) return;
    try {
      const data = await getUserProjects();
      setProjects(data || []);
    } catch (error) {
      console.error("Failed to fetch projects:", error);
    }
  }, [userId]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    if (projects.length > 0) {
      fetchTotals();
    } else {
      setLoadingTotals(false);
    }
  }, [projects, fetchTotals]);

  // Create project
  const handleCreate = async () => {
  if (!projectName.trim()) return;

  // Prevent bypassing limit
  if (projects.length >= maxProjects) {
    alert(`You cannot create more than ${maxProjects} projects on the ${plan} plan.`);
    return;
  }

  setLoading(true);
  try {
    await createProject({
      id: crypto.randomUUID(),
      name: projectName.trim(),
    });

    setOpen(false);
    setProjectName("");
    await fetchProjects();
  } catch (error) {
    console.error("Failed to create project:", error);
    alert("Error creating project. Check console.");
  } finally {
    setLoading(false);
  }
};

  // Delete project
  const handleDelete = async (projectId: string) => {
    if (!confirm("Are you sure you want to delete this project?")) return;
    try {
      await deleteAllProjectResponses(projectId)
      await deleteProjectsSurveys(projectId)
      await deleteProject(projectId);
      await fetchProjects();
    } catch (error) {
      console.error("Failed to delete project:", error);
      alert("Error deleting project. Check console.");
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto py-10 space-y-10">
      {/* Header */}
      <div className="flex items-center justify-between w-full">
        <h1 className="text-4xl font-bold tracking-tight">Projects</h1>
        <Button
  className="flex items-center gap-2"
  onClick={() => {
    if (projects.length >= maxProjects) {
      alert(`You have reached your project limit for the ${plan} plan.`);
      return;
    }
    setOpen(true);
  }}
  disabled={!subscription} // Disables during subscription loading
>
  <Plus size={18} />
  New Project
</Button>

      </div>

      <p className="text-muted-foreground text-base">
        Create and manage your survey projects here.
      </p>

      {/* Totals Section */}
      {projects.length > 0 && (
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-purple-50 border border-purple-200 rounded-lg px-4 py-2">
            <span className="font-semibold text-purple-900">Total Projects:</span>
            <span className="text-purple-700">{projects.length}</span>
          </div>
          <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
            <span className="font-semibold text-blue-900">Total Surveys:</span>
            <span className="text-blue-700">
              {loadingTotals ? "..." : totalSurveys}
            </span>
          </div>
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-4 py-2">
            <span className="font-semibold text-green-900">Total Responses:</span>
            <span className="text-green-700">
              {loadingTotals ? "..." : totalResponses}
            </span>
          </div>
        </div>
      )}

      {projects.length >= maxProjects && (
  <div className="p-4 border border-blue-300 bg-blue-50 rounded-lg">
    <p className="text-blue-700 font-medium">
      You’ve reached your project limit for the <strong>{plan}</strong> plan.
    </p>
    <Link
      href="/pricing"
      className="text-blue-600 underline text-sm"
    >
      Upgrade to increase your limits →
    </Link>
  </div>
)}


      {/* Projects List */}
      <div className="mt-8 space-y-4">
        {projects.length === 0 && (
          <div className="text-gray-400 italic text-center">Your projects will appear here.</div>
        )}

        {projects.map((project) => (
          <div
  key={project.id}
  className="p-6 border rounded-lg hover:shadow-lg transition flex justify-between items-center"
>
  <Link href={`/dashboard/${project.id}/create`} className="flex-1">
    {project.name}
  </Link>

  <div className="relative">
    <Button
      variant="outline"
      size="sm"
      onClick={(e) => {
        e.stopPropagation(); // SUPER IMPORTANT
        e.preventDefault();
        setMenuOpen(menuOpen === project.id ? null : project.id);
      }}
    >
      <MoreHorizontal size={18} />
    </Button>

    {menuOpen === project.id && (
      <div className="absolute right-0 mt-2 w-28 bg-white border rounded shadow-lg z-10">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            handleDelete(project.id);
          }}
        >
          <Trash2 size={16} />
          Delete
        </Button>
      </div>
    )}
  </div>
</div>

        ))}
      </div>

      {/* Create Project Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Create a Project</DialogTitle>
            <DialogDescription>
              Give your project a name so you can organize surveys inside it.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Input
              placeholder="Project Name"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              disabled={loading}
            />

            <Button className="w-full" onClick={handleCreate} disabled={loading} > {loading ? "Creating..." : "Create Project"} </Button>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}