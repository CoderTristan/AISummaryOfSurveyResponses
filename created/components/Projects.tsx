"use client";

import { useState, useEffect } from "react";
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
import { createProject, getUserProjects, deleteProject } from "@/lib/supabaseProjects"; // adjust path
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Projects() {
  const [open, setOpen] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [projectName, setProjectName] = useState("");
  const [loading, setLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState<string | null>(null); // project id for open menu
  const router = useRouter();

  async function fetchProjects() {
    try {
      const data = await getUserProjects();
      setProjects(data || []);
    } catch (error) {
      console.error("Failed to fetch projects:", error);
    }
  }

  useEffect(() => {
    fetchProjects();
  }, []);

  async function handleCreate() {
    if (!projectName.trim()) return;

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
  }

  async function handleDelete(projectId: string) {
    if (!confirm("Are you sure you want to delete this project?")) return;

    try {
      await deleteProject(projectId);
      await fetchProjects();
    } catch (error) {
      console.error("Failed to delete project:", error);
      alert("Error deleting project. Check console.");
    }
  }

  return (
    <div className="w-full max-w-6xl mx-auto py-10 space-y-10">
      {/* Header Row */}
      <div className="flex items-center justify-between w-full">
        <h1 className="text-4xl font-bold tracking-tight">Projects</h1>
        <Button className="flex items-center gap-2" onClick={() => setOpen(true)}>
          <Plus size={18} />
          New Project
        </Button>
      </div>

      <p className="text-muted-foreground text-base">
        Create and manage your survey projects here.
      </p>

      {/* Projects List */}
      <div className="mt-8 space-y-4">
        {projects.length === 0 && (
          <div className="text-gray-400 italic">Your projects will appear here.</div>
        )}

        {projects.map((project) => (
          <Link
            key={project.id}
            href={`/dashboard/${project.id}/create`}
            className="p-6 border rounded-lg hover:shadow-lg transition cursor-pointer flex justify-between items-center"
          >
            <span>{project.name}</span>

            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMenuOpen(menuOpen === project.id ? null : project.id)}
              >
                <MoreHorizontal size={18} />
              </Button>
              

              {menuOpen === project.id && (
                <div className="absolute right-0 mt-2 w-28 bg-white border rounded shadow-lg z-10">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start gap-2"
                    onClick={() => handleDelete(project.id)}
                  >
                    <Trash2 size={16} />
                    Delete
                  </Button>
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>

      {/* Modal */}
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

            <Button className="w-full" onClick={handleCreate} disabled={loading}>
              {loading ? "Creating..." : "Create Project"}
            </Button>

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
