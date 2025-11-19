'use client'

import { useState } from "react"
import { createSurvey, getSurveys } from "@/lib/supabaseSurveys";
import { useParams, useRouter } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { CardHeader, CardTitle, CardContent, Card } from "./ui/card";
import { Label} from "./ui/label";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";


export default function CreateSurveyPage() {
  const router = useRouter();
   const {projectId} = useParams()
  
  const [question, setQuestion] = useState("")
  const [type, setType] = useState("yesno")
  const [options, setOptions] = useState("")
  const [surveyId, setSurveyId] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

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
      router.refresh(); // refresh to show new survey if needed
    } catch (err) {
      console.error("Failed to create survey:", err);
      alert("Failed to create survey. Check console.");
    }
  }

  const previewOptions = options
    .split(",")
    .map(o => o.trim())
    .filter(o => o.length > 0)

  const previewLink = surveyId ? `/s/${surveyId}` : ""

  return (
    <div className="min-h-screen flex items-start justify-center py-16 px-4 bg-gray-50">
      <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-2 gap-8">

        {/* Survey Form */}
        <Card>
          <CardHeader>
            <CardTitle>Create OneQ Survey</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              
              <div className="space-y-1">
                <Label>Question</Label>
                <Input
                  placeholder="What do you want to ask?"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <Label>Question Type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yesno">Yes / No</SelectItem>
                    <SelectItem value="multiple">Multiple Choice</SelectItem>
                    <SelectItem value="rating">Rating (1–5)</SelectItem>
                    <SelectItem value="emoji">Emoji Picker</SelectItem>
                  </SelectContent>
                </Select>
              </div>

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

        {/* Survey Preview */}
        {surveyId && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Survey Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold mb-4">{question}</p>

              {type === "yesno" && (
                <div className="space-x-2">
                  <Button>Yes</Button>
                  <Button variant="secondary">No</Button>
                </div>
              )}

              {type === "multiple" && (
                <div className="space-y-2">
                  {previewOptions.map((o) => (
                    <Button key={o} variant="secondary" className="w-full">{o}</Button>
                  ))}
                </div>
              )}

              {type === "rating" && (
                <div className="space-x-1">
                  {[1,2,3,4,5].map(n => <Button key={n} variant="secondary">{n}</Button>)}
                </div>
              )}

              {type === "emoji" && (
                <div className="space-x-1 text-2xl">
                  {["😡","😕","😐","🙂","🤩"].map(e => (
                    <button key={e} className="p-2 hover:bg-gray-100 rounded">{e}</button>
                  ))}
                </div>
              )}

              <div className="mt-6">
                <Label>Survey Link</Label>
                <Input readOnly value={previewLink} className="mt-1" />
              </div>
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  )
}
