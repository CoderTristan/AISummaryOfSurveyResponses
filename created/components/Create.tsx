"use client";

import { useState, ChangeEvent, FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { createSurvey } from "@/lib/supabaseSurveys";

import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "./ui/select";
import { Copy, Check } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";

export default function CreateSurveyPage() {
  const router = useRouter();
  const params = useParams();
  const projectId =
    Array.isArray(params.projectId) && params.projectId.length > 0
      ? params.projectId[0]
      : (params.projectId as string | undefined);

  const [question, setQuestion] = useState<string>("");
  const [type, setType] = useState<
    "yesno" | "multiple" | "rating" | "emoji" | "text"
  >("yesno");
  const [options, setOptions] = useState<string>("");
  const [surveyId, setSurveyId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [created, setCreated] = useState<boolean>(false);
  const [openForm, setOpenForm] = useState<boolean>(false);
  const [themeColor, setThemeColor] = useState<string>("#6366f1");

  const baseUrl =
    typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";

  const optionArray = (): string[] =>
    options
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

  const escapeHtml = (s: string) =>
    String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");

  const generateWidgetCode = (
    id: string,
    q: string,
    t: typeof type,
    opts: string[]
  ) => {
    const apiUrl = `${baseUrl}/api/surveys/${id}/responses`;

    const optionsHtml =
      t === "yesno"
        ? `<div class="oneq-row"><button class="oneq-btn" data-value="yes">Yes</button><button class="oneq-btn" data-value="no">No</button></div>`
        : t === "multiple" && opts.length
        ? `<div class="oneq-col">${opts
            .map(
              (o) => `<button class="oneq-btn" data-value="${escapeHtml(
                o
              )}">${escapeHtml(o)}</button>`
            )
            .join("")}</div>`
        : t === "rating"
        ? `<div class="oneq-row">${[1, 2, 3, 4, 5]
            .map((n) => `<button class="oneq-rate" data-value="${n}">${n}</button>`)
            .join("")}</div>`
        : t === "emoji"
        ? `<div class="oneq-row">${["😡", "😕", "😐", "🙂", "🤩"]
            .map(
              (e) =>
                `<button class="oneq-emoji" data-value="${encodeURIComponent(
                  e
                )}">${e}</button>`
            )
            .join("")}</div>`
        : `<div class="oneq-col"><input class="oneq-text" placeholder="Type your answer…" /></div>`;

    const css = `
<style>
.oneq-w{font-family:Inter;padding:18px;border-radius:14px;background:#fff;box-shadow:0 8px 30px rgba(0,0,0,0.08);max-width:520px;border-top:6px solid ${themeColor}}
.oneq-q{font-weight:600;margin-bottom:14px;color:#0f172a}
.oneq-row{display:flex;gap:8px}
.oneq-col{display:flex;flex-direction:column;gap:8px}
.oneq-btn,.oneq-rate,.oneq-emoji{border:1px solid #e6e9ef;background:#f8fafb;padding:10px 14px;border-radius:10px;cursor:pointer;font-weight:600;transition:0.15s}
.oneq-btn:hover,.oneq-rate:hover,.oneq-emoji:hover{background:${themeColor};color:white}
.oneq-text{padding:10px;border-radius:8px;border:1px solid #e6e9ef;width:100%}
.oneq-submit{margin-top:12px;padding:10px;border-radius:10px;border:none;background:${themeColor};color:#fff;font-weight:600;cursor:pointer}
.oneq-small{font-size:12px;color:#8b949e;margin-top:10px;text-align:center}
</style>`;

    const js = `<script>(function(){try{const w=document.getElementById('oneq-${id}');if(!w)return;const btns=w.querySelectorAll('.oneq-btn,.oneq-rate,.oneq-emoji');const text=w.querySelector('.oneq-text');const submit=w.querySelector('.oneq-submit');let val='';function setSelected(el){btns.forEach(b=>b.classList.remove('selected'));el&&el.classList.add('selected')}btns.forEach(b=>{b.addEventListener('click',function(e){e.preventDefault();val=decodeURIComponent(this.dataset.value||this.innerText);setSelected(this);if(submit)submit.disabled=false})});if(text){text.addEventListener('input',()=>{val=text.value.trim();if(submit)submit.disabled=!val})}if(submit){submit.addEventListener('click',async function(){if(!val)return;try{await fetch('${apiUrl}',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({answer:val})});w.innerHTML='<div style="text-align:center;padding:28px"><div style="font-size:28px;margin-bottom:8px">✓</div><div style="font-weight:700">Thanks!</div><div style="color:#6b7280;font-size:13px">Response recorded.</div></div>'}catch(e){console.error(e)}})}}catch(e){console.error(e)}})();</script>`;

    return `<div id="oneq-${id}" class="oneq-w"><div class="oneq-q">${escapeHtml(
      q
    )}</div>${optionsHtml}<div><button class="oneq-submit" ${
      t !== "text" ? "disabled" : ""
    }>Submit</button></div><div class="oneq-small">Powered by OneQ</div></div>${css}${js}`;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!question.trim()) return;

    setLoading(true);
    setCreated(false);

    const id = crypto.randomUUID();
    setSurveyId(id);

    const survey_link = `${baseUrl}/survey/${id}`;
    const survey_iframe = `<iframe src="${survey_link}" style="width:100%; height:360px; border:none;"></iframe>`;
    const survey_widget = generateWidgetCode(id, question, type, optionArray());
    const survey_script = `<div id="oneq-${id}"></div><script>(function(){var w=document.getElementById('oneq-${id}');if(!w)return;w.innerHTML=${JSON.stringify(
      survey_widget
    )};})();</script>`;

    const payload = {
      id,
      question,
      type,
      survey_link,
      survey_iframe,
      survey_script,
      survey_widget,
      options: type === "multiple" ? optionArray() : null,
      project_id: projectId ?? undefined,
    };

    try {
      await createSurvey(payload);
      setCreated(true);
      router.refresh();
    } catch (err) {
      console.error("createSurvey failed", err);
      alert("Failed to create survey — check console.");
    } finally {
      setLoading(false);
    }
  };

  const previewLink = surveyId ? `${baseUrl}/survey/${surveyId}` : "";
  const iframeEmbed = surveyId
    ? `<iframe src="${previewLink}" style="width:100%; height:360px; border:none;"></iframe>`
    : "";
  const scriptEmbed = surveyId
    ? `<div id="oneq-${surveyId}"></div>
<script>
(function(){var w=document.getElementById('oneq-${surveyId}');if(!w)return;w.innerHTML=${JSON.stringify(
        generateWidgetCode(surveyId, question, type, optionArray())
      )};})();
</script>`
    : "";
  const widgetEmbed = surveyId
    ? generateWidgetCode(surveyId, question, type, optionArray())
    : "";

  const doCopy = async (text: string, name: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(name);
      setTimeout(() => setCopiedField(null), 1500);
    } catch (e) {
      alert("Copy failed");
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      {!openForm ? (
        <div className="flex justify-center items-center h-full">
          <Button onClick={() => setOpenForm(true)} className="px-6 py-4 text-lg">
            Create Survey
          </Button>
        </div>
      ) : (
        <>
          

          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 transition-all">
            
            <Card className="shadow-lg border-l-[6px]" style={{ borderColor: themeColor }}>
              <CardHeader>
                <CardTitle>Create a OneQ Survey <div className="flex flex-col gap-1 text-sm mx-64">
            <Label>Theme Color</Label>
            <input
              type="color"
              value={themeColor}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setThemeColor(e.target.value)}
              className="w-10 h-10 rounded cursor-pointer"
            />
          </div></CardTitle>
                
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label>Question</Label>
                    <Input
                      placeholder="Ask something..."
                      value={question}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setQuestion(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <Label>Type</Label>
                    <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
                      <SelectTrigger>
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
                      <Label>Options (comma separated)</Label>
                      <Textarea
                        placeholder="Red, Blue, Green"
                        value={options}
                        onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setOptions(e.target.value)}
                      />
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Button type="submit" className="flex-1" disabled={loading}>
                      {loading ? "Creating…" : "Create Survey"}
                    </Button>
                    {created && <div className="text-green-600 font-medium">Created ✓</div>}
                  </div>
                  <div className="text-xs text-gray-500">
                    Create a short single-question survey and embed anywhere.
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card className="shadow-lg max-h-24">
              <CardContent className="flex flex-col gap-4">
                {!surveyId ? (
                  <div className="text-gray-500">Preview will appear after creating a survey.</div>
                ) : (
                  <>
                    <div className="border rounded-lg p-4 bg-white">
                      <div dangerouslySetInnerHTML={{ __html: widgetEmbed }} />
                    </div>

                    <Tabs defaultValue="widget" className="w-full">
                      <TabsList className="grid grid-cols-4 gap-1 mb-3">
                        <TabsTrigger value="widget">Widget</TabsTrigger>
                        <TabsTrigger value="link">Link</TabsTrigger>
                        <TabsTrigger value="iframe">iFrame</TabsTrigger>
                        <TabsTrigger value="script">Script</TabsTrigger>
                      </TabsList>

                      <TabsContent value="widget" className="space-y-2">
                        <div className="text-xs text-gray-500">
                          Paste this native widget HTML into any page (recommended).
                        </div>
                        <div className="flex gap-2">
                          <Textarea
                            readOnly
                            rows={6}
                            value={widgetEmbed}
                            className="font-mono text-xs max-h-24"
                          />
                          <Button variant="outline" onClick={() => doCopy(widgetEmbed, "widget")}>
                            {copiedField === "widget" ? <Check /> : <Copy />}
                          </Button>
                        </div>
                      </TabsContent>

                      <TabsContent value="link" className="space-y-2">
                        <div className="text-xs text-gray-500">Share this direct link.</div>
                        <div className="flex gap-2">
                          <Input
                            readOnly
                            value={previewLink}
                            className="font-mono text-sm"
                          />
                          <Button variant="outline" onClick={() => doCopy(previewLink, "link")}>
                            {copiedField === "link" ? <Check /> : <Copy />}
                          </Button>
                        </div>
                      </TabsContent>

                      <TabsContent value="iframe" className="space-y-2">
                        <div className="text-xs text-gray-500">
                          Traditional iframe embed (works everywhere).
                        </div>
                        <div className="flex gap-2">
                          <Textarea
                            readOnly
                            rows={3}
                            value={iframeEmbed}
                            className="font-mono text-xs max-h-24"
                          />
                          <Button variant="outline" onClick={() => doCopy(iframeEmbed, "iframe")}>
                            {copiedField === "iframe" ? <Check /> : <Copy />}
                          </Button>
                        </div>
                      </TabsContent>

                      <TabsContent value="script" className="space-y-2">
                        <div className="text-xs text-gray-500">
                          JavaScript embed that injects the widget into a placeholder div.
                        </div>
                        <div className="flex gap-2">
                          <Textarea
                            readOnly
                            rows={6}
                            value={scriptEmbed}
                            className="font-mono text-xs max-h-24"
                          />
                          <Button variant="outline" onClick={() => doCopy(scriptEmbed, "script")}>
                            {copiedField === "script" ? <Check /> : <Copy />}
                          </Button>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
