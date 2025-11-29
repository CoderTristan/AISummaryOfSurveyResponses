"use client";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Copy, Check, Plus } from "lucide-react";
import Link from "next/link";

export default function CreateSurveyUI(props: any) {
  const {
    surveys,
    maxSurveys,
    plan,
    openForm,
    setOpenForm,

    question,
    setQuestion,

    type,
    setType,

    options,
    setOptions,

    themeColor,
    setThemeColor,

    activeTab,
    setActiveTab,

    surveyId,
    loading,
    created,

    widgetEmbed,
    previewLink,
    iframeEmbed,
    scriptEmbed,

    reactComponent,
    copiedField,

    livePreview,

    handleSubmit,
    doCopy,
  } = props;

  const surveyExamples = [
    {
      type: "yesno",
      question: "Would you recommend us?",
      options: ["Yes", "No"],
    },
    {
      type: "multiple",
      question: "What's your favorite feature?",
      options: ["Speed", "Design", "Support", "Pricing"],
    },
    {
      type: "rating",
      question: "How was your experience?",
      options: ["1", "2", "3", "4", "5"],
    },
    {
      type: "emoji",
      question: "How do you feel today?",
      options: ["😡", "😕", "😐", "🙂", "🤩"],
    },
    {
      type: "text",
      question: "What can we improve?",
      options: [],
    },
  ];

  return (
    <div className="min-h-screen w-full bg-gray-50 p-6">
      {!openForm ? (
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-semibold text-gray-900">Create Survey</h1>

            {surveys.length >= maxSurveys && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700">
                  You’ve reached your survey limit for the <strong>{plan}</strong> plan.
                </p>
                <Link href="/pricing" className="text-blue-600 underline text-sm font-medium">
                  Upgrade to unlock more surveys →
                </Link>
              </div>
            )}

            <Button
              onClick={() => {
                if (surveys.length >= maxSurveys) {
                  alert(`You've reached your survey limit for the ${plan} plan.`);
                  return;
                }
                setOpenForm(true);
              }}
              size="sm"
              className="gap-2"
            >
              <Plus size={16} />
              Create new
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {surveyExamples.map((ex, i) => (
              <button
                key={i}
                onClick={() => {
                  setType(ex.type);
                  setQuestion(ex.question);
                  if (ex.type === "multiple") setOptions(ex.options.join(", "));
                  setOpenForm(true);
                }}
                className="group bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 hover:shadow-md transition-all text-left"
              >
                <div className="aspect-square bg-gray-50 rounded mb-3 flex items-center justify-center overflow-hidden">
                  <div className="scale-75 transform">
                    {ex.type === "yesno" && <div className="flex gap-1"><div className="w-12 h-8 bg-gray-200 rounded"></div><div className="w-12 h-8 bg-gray-200 rounded"></div></div>}
                    {ex.type === "multiple" && <div className="space-y-1">{[1,2,3].map(i => <div key={i} className="w-24 h-6 bg-gray-200 rounded"></div>)}</div>}
                    {ex.type === "rating" && <div className="flex gap-1">{[1,2,3,4,5].map(i => <div key={i} className="w-6 h-6 bg-gray-200 rounded"></div>)}</div>}
                    {ex.type === "emoji" && <div className="flex gap-1 text-xl">{ex.options.map((e,i)=><span key={i}>{e}</span>)}</div>}
                    {ex.type === "text" && <div className="w-28 h-8 bg-gray-200 rounded"></div>}
                  </div>
                </div>
                <div className="text-xs font-medium text-gray-700 capitalize">
                  {ex.type === "yesno" ? "Yes/No" : ex.type}
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[400px,1fr] gap-6">
          {/* Sidebar */}
          <div className="space-y-4">
            <Button variant="ghost" size="sm" onClick={() => setOpenForm(false)} className="text-gray-600">
              ← Back
            </Button>

            <Card className="border-l-4" style={{ borderLeftColor: themeColor }}>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Survey Settings</CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                <div>
                  <Label className="text-xs">Question</Label>
                  <Input value={question} onChange={(e) => setQuestion(e.target.value)} className="mt-1" />
                </div>

                <div>
                  <Label className="text-xs">Type</Label>
                  <Select value={type} onValueChange={(v) => setType(v as any)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yesno">Yes / No</SelectItem>
                      <SelectItem value="multiple">Multiple Choice</SelectItem>
                      <SelectItem value="rating">Rating (1–5)</SelectItem>
                      <SelectItem value="emoji">Emoji Picker</SelectItem>
                      <SelectItem value="text">Text</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {type === "multiple" && (
                  <div>
                    <Label className="text-xs">Options (comma separated)</Label>
                    <Textarea rows={3} value={options} onChange={(e) => setOptions(e.target.value)} className="mt-1" />
                  </div>
                )}

                <div>
                  <Label className="text-xs">Theme Color</Label>
                  <input type="color" value={themeColor} onChange={(e) => setThemeColor(e.target.value)} className="w-full h-10 border rounded mt-1" />
                </div>

                <Button className="w-full mt-2" onClick={handleSubmit} disabled={loading}>
                  {loading ? "Creating…" : created ? "Created ✓" : "Create Survey"}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Preview */}
          <div className="lg:sticky lg:top-6">
            <div className="space-y-4">
              <Card className="border-2 shadow-xl">
                <CardContent className="p-12">
                  <div className="max-w-xl mx-auto">
                    {question.trim() ? (
                      <div dangerouslySetInnerHTML={{ __html: livePreview }} />
                    ) : (
                      <div className="text-center text-gray-400 py-12">Enter a question to see preview</div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {surveyId && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Embed Code</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                      <TabsList className="grid grid-cols-5 mb-3">
                        <TabsTrigger value="widget">Widget</TabsTrigger>
                        <TabsTrigger value="link">Link</TabsTrigger>
                        <TabsTrigger value="iframe">iFrame</TabsTrigger>
                        <TabsTrigger value="script">Script</TabsTrigger>
                        <TabsTrigger value="react">React</TabsTrigger>
                      </TabsList>

                      {/* WIDGET */}
                      <TabsContent value="widget">
                        <div className="flex gap-2">
                          <Textarea readOnly rows={4} value={widgetEmbed} className="font-mono text-xs" />
                          <Button variant="outline" size="icon" onClick={() => doCopy(widgetEmbed, "widget")}>
                            {copiedField === "widget" ? <Check size={16} /> : <Copy size={16} />}
                          </Button>
                        </div>
                      </TabsContent>

                      {/* LINK */}
                      <TabsContent value="link">
                        <div className="flex gap-2">
                          <Input readOnly value={previewLink} className="font-mono text-xs" />
                          <Button variant="outline" size="icon" onClick={() => doCopy(previewLink, "link")}>
                            {copiedField === "link" ? <Check size={16} /> : <Copy size={16} />}
                          </Button>
                        </div>
                      </TabsContent>

                      {/* IFRAME */}
                      <TabsContent value="iframe">
                        <div className="flex gap-2">
                          <Textarea readOnly rows={2} value={iframeEmbed} className="font-mono text-xs" />
                          <Button variant="outline" size="icon" onClick={() => doCopy(iframeEmbed, "iframe")}>
                            {copiedField === "iframe" ? <Check size={16} /> : <Copy size={16} />}
                          </Button>
                        </div>
                      </TabsContent>

                      {/* SCRIPT */}
                      <TabsContent value="script">
                        <div className="flex gap-2">
                          <Textarea readOnly rows={4} value={scriptEmbed} className="font-mono text-xs" />
                          <Button variant="outline" size="icon" onClick={() => doCopy(scriptEmbed, "script")}>
                            {copiedField === "script" ? <Check size={16} /> : <Copy size={16} />}
                          </Button>
                        </div>
                      </TabsContent>

                      {/* REACT */}
                      <TabsContent value="react">
                        <div className="flex gap-2">
                          <Textarea readOnly rows={12} value={reactComponent} className="font-mono text-xs" />
                          <Button variant="outline" size="icon" onClick={() => doCopy(reactComponent, "react")}>
                            {copiedField === "react" ? <Check size={16} /> : <Copy size={16} />}
                          </Button>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
