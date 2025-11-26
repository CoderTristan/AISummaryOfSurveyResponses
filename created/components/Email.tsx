"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Mail, Clock, CheckCircle2, Loader2 } from "lucide-react";
import { getProject, updateProjectEmailFields} from "@/lib/supabaseProjects";

interface EmailSettingsProps {
  projectId: string;
}

export default function EmailSettings({ projectId }: EmailSettingsProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    notify_enabled: false,
    report_frequency: "weekly",
    notify_email: "",
  });
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (!projectId) return;
    loadSettings();
  }, [projectId]);

  async function loadSettings() {
    setLoading(true);
    try {
      const project = await getProject(projectId);
      if (project) {
        setSettings({
          notify_enabled: project.notify_enabled || false,
          report_frequency: project.report_frequency || "weekly",
          notify_email: project.notify_email || "",
        });
      }
    } catch (err) {
      console.error("Failed to load email settings:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdate(updates: Partial<typeof settings>) {
    setSaving(true);
    setSaveSuccess(false);
    try {
      const newSettings = { ...settings, ...updates };
      await updateProjectEmailFields(projectId, newSettings);
      setSettings(newSettings);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      console.error("Failed to update email settings", err);
      alert("Failed to update email settings.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-gray-400" size={32} />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Mail className="text-blue-600" size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Email Report Settings</h1>
            <p className="text-gray-500">Configure automated email reports for your surveys</p>
          </div>
        </div>
      </div>

      {/* Save Success Indicator */}
      {saveSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle2 className="text-green-600" size={20} />
          <span className="text-green-800 font-medium">Settings saved successfully!</span>
        </div>
      )}

      {/* Main Settings Card */}
      <Card className="border-2 shadow-lg">
        <CardHeader>
          <CardTitle>Email Notifications</CardTitle>
          <CardDescription>
            Receive periodic reports with survey statistics and responses
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Enable/Disable Toggle */}
          <div className="flex items-center justify-between p-4 border-2 rounded-lg bg-gradient-to-r from-white to-gray-50">
            <div className="space-y-1">
              <Label className="text-base font-semibold">Enable Email Reports</Label>
              <p className="text-sm text-gray-500">
                Turn on automated email reports for all surveys in this project
              </p>
            </div>
            <Switch
              checked={settings.notify_enabled}
              onCheckedChange={(val) => handleUpdate({ notify_enabled: val })}
              disabled={saving}
            />
          </div>

          {/* Conditional Settings - Only show when enabled */}
          {settings.notify_enabled && (
            <div className="space-y-6 pl-6 border-l-4 border-blue-500">
              {/* Email Address */}
              <div className="space-y-3">
                <Label htmlFor="email" className="text-base font-semibold">
                  Email Address
                </Label>
                <p className="text-sm text-gray-500 mb-2">
                  Reports will be sent to this email address
                </p>
                <div className="flex gap-2">
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={settings.notify_email}
                    onChange={(e) => setSettings({ ...settings, notify_email: e.target.value })}
                    disabled={saving}
                    className="flex-1"
                  />
                  <Button
                    onClick={() => handleUpdate({ notify_email: settings.notify_email })}
                    disabled={saving || !settings.notify_email}
                    className="min-w-[100px]"
                  >
                    {saving ? (
                      <Loader2 className="animate-spin" size={16} />
                    ) : (
                      "Save Email"
                    )}
                  </Button>
                </div>
              </div>

              {/* Frequency Settings */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Clock size={18} className="text-gray-600" />
                  <Label className="text-base font-semibold">Report Frequency</Label>
                </div>
                <p className="text-sm text-gray-500">
                  Choose how often you want to receive survey reports
                </p>
                
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <button
                    onClick={() => handleUpdate({ report_frequency: "daily" })}
                    disabled={saving}
                    className={`p-4 border-2 rounded-lg text-left transition-all ${
                      settings.report_frequency === "daily"
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300 bg-white"
                    } ${saving ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    <div className="font-semibold mb-1">Daily</div>
                    <div className="text-sm text-gray-500">
                      Receive reports every day
                    </div>
                  </button>

                  <button
                    onClick={() => handleUpdate({ report_frequency: "weekly" })}
                    disabled={saving}
                    className={`p-4 border-2 rounded-lg text-left transition-all ${
                      settings.report_frequency === "weekly"
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300 bg-white"
                    } ${saving ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    <div className="font-semibold mb-1">Weekly</div>
                    <div className="text-sm text-gray-500">
                      Receive reports every week
                    </div>
                  </button>
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex gap-3">
                  <Mail className="text-blue-600 mt-0.5" size={18} />
                  <div className="space-y-1">
                    <p className="font-medium text-blue-900">
                      {settings.report_frequency === "daily" ? "Daily" : "Weekly"} reports enabled
                    </p>
                    <p className="text-sm text-blue-700">
                      Reports will be sent {settings.report_frequency === "daily" ? "every day" : "every week"} to{" "}
                      <span className="font-medium">{settings.notify_email || "your email"}</span> with 
                      comprehensive statistics and responses for all surveys in this project.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}