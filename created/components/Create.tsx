'use client'

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { createSurvey } from "@/lib/supabaseClient"
import {supabase} from "@/lib/supabase"

export default function CreateSurveyPage() {
  const [question, setQuestion] = useState("")
  const [type, setType] = useState("yesno")
  const [options, setOptions] = useState("")
  const [surveyId, setSurveyId] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // get logged in user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      alert("You must be logged in!")
      return
    }

    const id = Math.random().toString(36).slice(2, 8)
    setSurveyId(id)

    const optionList =
      type === "multiple"
        ? options.split(",").map(o => o.trim()).filter(o => o.length > 0)
        : null

    await createSurvey({
      id,
      user_id: user.id,
      question,
      type,
      options: optionList
    })
  }

  const optionList = options
    .split(",")
    .map(o => o.trim())
    .filter(o => o.length > 0)

  const previewLink = surveyId ? `/s/${surveyId}` : ""

  return (
    <div className="min-h-screen flex items-start justify-center py-16 px-4 bg-gray-50">
      <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-2 gap-8">

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
                  {optionList.map((o) => (
                    <Button key={o} variant="secondary" className="w-full">
                      {o}
                    </Button>
                  ))}
                </div>
              )}

              {type === "rating" && (
                <div className="space-x-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Button key={n} variant="secondary">{n}</Button>
                  ))}
                </div>
              )}

              {type === "emoji" && (
                <div className="space-x-1 text-2xl">
                  {["😡", "😕", "😐", "🙂", "🤩"].map((e) => (
                    <button key={e} className="p-2 hover:bg-gray-100 rounded">
                      {e}
                    </button>
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
