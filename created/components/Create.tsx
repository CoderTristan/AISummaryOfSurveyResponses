"use client";

import { useState } from "react";
import { createSurvey } from "@/lib/supabaseSurveys";
import { useParams, useRouter } from "next/navigation";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { CardHeader, CardTitle, CardContent, Card } from "./ui/card";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { Copy } from "lucide-react";

export default function CreateSurveyPage() {
  const router = useRouter();
  const params = useParams();

  let projectId = params.projectId;
  projectId = Array.isArray(projectId) ? projectId[0] : projectId;

  const [question, setQuestion] = useState("");
  const [type, setType] = useState("yesno");
  const [options, setOptions] = useState("");
  const [surveyId, setSurveyId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!question) return;

    const id = crypto.randomUUID();
    setSurveyId(id);

    const optionList =
      type === "multiple"
        ? options.split(",").map(o => o.trim()).filter(o => o.length > 0)
        : null;

    try {
      await createSurvey({
        id,
        question,
        type,
        options: optionList,
        project_id: projectId,
      });

      router.refresh();
    } catch (err) {
      console.error(err);
      alert("Survey creation failed.");
    }
  };

  const previewOptions = options
    .split(",")
    .map(o => o.trim())
    .filter(o => o.length > 0);
  console.log(surveyId)
  const previewLink = surveyId ? `http://localhost:3000/survey/${surveyId}` : "";
  const embedCode = surveyId
    ? `<iframe src="http://localhost:3000/survey/${surveyId}" style="width:100%; height:260px; border:none;" scrolling="no"></iframe>`
    : "";

  function copy(text: string) {
    navigator.clipboard.writeText(text);
  }

  return (
    <div className="min-h-screen flex items-start justify-center py-16 px-4 bg-gray-50">
      <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-2 gap-8">

        {/* CREATE FORM */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Create OneQ Survey</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>

              {/* Question */}
              <div className="space-y-1">
                <Label>Question</Label>
                <Input
                  placeholder="What do you want to ask?"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  required
                />
              </div>

              {/* Type */}
              <div className="space-y-1">
                <Label>Type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yesno">Yes / No</SelectItem>
                    <SelectItem value="multiple">Multiple Choice</SelectItem>
                    <SelectItem value="rating">Rating (1–5)</SelectItem>
                    <SelectItem value="emoji">Emoji Picker</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Multi options */}
              {type === "multiple" && (
                <div className="space-y-1">
                  <Label>Options (comma separated)</Label>
                  <Textarea
                    placeholder="Red, Blue, Green"
                    value={options}
                    onChange={(e) => setOptions(e.target.value)}
                  />
                </div>
              )}

              <Button type="submit" className="w-full">
                Create Survey
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* PREVIEW + EMBED */}
        {surveyId && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Survey Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">


              {/* LINK */}
              <div className="space-y-1">
                <Label>Survey Link</Label>
                <div className="flex gap-2">
                  <Input readOnly value={previewLink} />
                  <Button variant="outline" onClick={() => copy(previewLink)}>
                    <Copy size={16} />
                  </Button>
                </div>
              </div>

              {/* IFRAME EMBED */}
              <div className="space-y-1">
                <Label>Embed as iFrame</Label>
                <div className="flex gap-2">
                  <Textarea readOnly value={embedCode} rows={3} />
                  <Button variant="outline" onClick={() => copy(embedCode)}>
                    <Copy size={16} />
                  </Button>
                </div>
              </div>

              {/* LIVE IFRAME PREVIEW */}
              <div className="border rounded-lg overflow-hidden">
                <iframe
                  src={previewLink}
                  style={{ width: "100%", height: "260px", border: "none" }}
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
