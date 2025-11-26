"use client";

import { useState, ChangeEvent } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Copy, Check, Plus } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

// Add these imports at the top
import { useParams, useRouter } from "next/navigation";
import { createSurvey } from "@/lib/supabaseSurveys";

export default function CreateSurveyPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"widget" | "link" | "iframe" | "script">("widget");

  const params = useParams();
  const projectId =
    Array.isArray(params.projectId) && params.projectId.length > 0
      ? params.projectId[0]
      : (params.projectId as string | undefined);

  const [question, setQuestion] = useState<string>("");
  const [reactComponent, setReactComponent] = useState<string>("");
  const [type, setType] = useState<"yesno" | "multiple" | "rating" | "emoji" | "text">("yesno");
  const [options, setOptions] = useState<string>("");
  const [surveyId, setSurveyId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [created, setCreated] = useState<boolean>(false);
  const [openForm, setOpenForm] = useState<boolean>(false);
  const [themeColor, setThemeColor] = useState<string>("#6366f1");

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL

  const surveyExamples = [
    {
      type: "yesno",
      question: "Would you recommend us?",
      options: ["Yes", "No"]
    },
    {
      type: "multiple",
      question: "What's your favorite feature?",
      options: ["Speed", "Design", "Support", "Pricing"]
    },
    {
      type: "rating",
      question: "How was your experience?",
      options: ["1", "2", "3", "4", "5"]
    },
    {
      type: "emoji",
      question: "How do you feel today?",
      options: ["😡", "😕", "😐", "🙂", "🤩"]
    },
    {
      type: "text",
      question: "What can we improve?",
      options: []
    }
  ];

  const optionArray = (): string[] =>
    options.split(",").map((s) => s.trim()).filter(Boolean);

  const generateWidgetCode = (id: string, q: string, t: typeof type, opts: string[]) => {
  const escapeHtml = (s: string) =>
    String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");

  const renderOptionsHtml = () => {
    const buttonStyle = `border:2px solid ${themeColor}; border-radius:.5rem; padding:.75rem 1rem; font-weight:600; cursor:pointer; transition:0.15s; background:white;`;
    const buttonHover = `this.style.background='${themeColor}'; this.style.color='white';`;
    const buttonReset = `this.style.background='white'; this.style.color='${themeColor}';`;

    if (t === "yesno") {
      return `
        <div style="display:flex;gap:8px;justify-content:center;">
          <button style="${buttonStyle}" onmouseover="${buttonHover}" onmouseout="${buttonReset}" data-value="yes">Yes</button>
          <button style="${buttonStyle}" onmouseover="${buttonHover}" onmouseout="${buttonReset}" data-value="no">No</button>
        </div>
      `;
    }

    if (t === "multiple" && opts.length) {
      return `
        <div style="display:flex;flex-direction:column;gap:8px;">
          ${opts.map(o => `<button style="${buttonStyle}" onmouseover="${buttonHover}" onmouseout="${buttonReset}" data-value="${escapeHtml(o)}">${escapeHtml(o)}</button>`).join("")}
        </div>
      `;
    }

    if (t === "rating") {
      return `
        <div style="display:flex;gap:8px;justify-content:center;">
          ${[1,2,3,4,5].map(n => `<button style="${buttonStyle}" onmouseover="${buttonHover}" onmouseout="${buttonReset}" data-value="${n}">${n}</button>`).join("")}
        </div>
      `;
    }

    if (t === "emoji") {
      const emojis = ["😡","😕","😐","🙂","🤩"];
      return `
        <div style="display:flex;gap:8px;justify-content:center;">
          ${emojis.map(e => `<button style="${buttonStyle}" onmouseover="${buttonHover}" onmouseout="${buttonReset}" data-value="${encodeURIComponent(e)}">${e}</button>`).join("")}
        </div>
      `;
    }

    // text input
    return `<textarea style="width:100%; padding:.75rem; border:2px solid ${themeColor}; border-radius:.5rem; font-family:inherit;" placeholder="Type your answer…"></textarea>`;
  };

  return `
<div id="oneq-${id}" style="
  font-family:Inter, sans-serif;
  background:white;
  border-radius:1rem;
  border:2px solid ${themeColor}33;
  max-width:400px;
  margin:auto;
  padding:2rem;
  display:flex;
  flex-direction:column;
  gap:1rem;
  text-align:center;
">
  <div style="font-weight:600; font-size:1.25rem; color:#0f172a;">${escapeHtml(q)}</div>
  ${renderOptionsHtml()}
  <button id="oneq-submit" style="
    background:${themeColor};
    color:white;
    border:none;
    border-radius:.5rem;
    padding:.75rem 1rem;
    font-weight:600;
    cursor:pointer;
    margin-top:1rem;
  ">Submit</button>
  <div id="oneq-thanks" style="font-size:.75rem; color:#6b7280; margin-top:.5rem; display:none;">Thanks for responding!</div>
</div>

<script>
(function(){
  const container = document.getElementById('oneq-${id}');
  let answer = null;

  container.querySelectorAll('button[data-value]').forEach(btn => {
    btn.addEventListener('click', e => {
      answer = btn.getAttribute('data-value');
      container.querySelectorAll('button[data-value]').forEach(b => {
        b.style.background = 'white';
        b.style.color = '${themeColor}';
      });
      btn.style.background = '${themeColor}';
      btn.style.color = 'white';
    });
  });

  const textarea = container.querySelector('textarea');
  if(textarea){
    textarea.addEventListener('input', e => {
      answer = textarea.value;
    });
  }

  container.querySelector('#oneq-submit').addEventListener('click', async () => {
    if(!answer) return;
    try {
      await fetch('${baseUrl}/api/surveys/${id}/responses', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ answer })
      });
      container.querySelector('#oneq-thanks').style.display='block';
    } catch(err){
      alert('Failed to submit');
    }
  });
})();
</script>
  `;
};


// Live preview uses the same function
const generateLivePreview = () => {
  if (!question.trim()) return "";
  return generateWidgetCode("preview", question, type, optionArray());
};

const generateReactComponent = (id: string, q: string, t: typeof type, opts: string[], color: string) => {
  const options = opts.map(o => JSON.stringify(o)).join(", ");
  return `
import { useState } from 'react';

export default function OneQWidget() {
  const [answer, setAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const options = [${options}];

  const handleSubmit = async () => {
    if(!answer) return;
    await fetch('${process.env.APP_URL}/api/surveys/${id}/responses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answer }),
    });
    setSubmitted(true);
  };

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', maxWidth: 400, margin: 'auto', padding: 16, border: '2px solid ${color}33', borderRadius: 16, textAlign: 'center' }}>
      <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 12 }}>${q}</div>
      {t === 'text' ? (
        <textarea value={answer} onChange={e => setAnswer(e.target.value)} placeholder="Type your answer…" style={{ width: '100%', padding: 12, border: '2px solid ${color}', borderRadius: 8 }} />
      ) : (
        <div style={{ display: 'flex', flexDirection: t==='multiple'?'column':'row', gap: 8, justifyContent: 'center' }}>
          {options.map(o => (
            <button key={o} onClick={() => setAnswer(o)} style={{ border: '2px solid ${color}', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', backgroundColor: answer===o?'${color}':'white', color: answer===o?'white':'${color}' }}>
              {o}
            </button>
          ))}
        </div>
      )}
      <button onClick={handleSubmit} style={{ marginTop: 12, padding: '8px 16px', borderRadius: 8, fontWeight: 600, backgroundColor: '${color}', color: 'white', cursor: 'pointer' }}>
        Submit
      </button>
      {submitted && <div style={{ marginTop: 8, color: '#6b7280', fontSize: 12 }}>Thanks for responding!</div>}
    </div>
  );
}
  `;
};

const handleSubmit = async () => {
  if (!question.trim()) return;
  setLoading(true);
  setCreated(false);

  const id = crypto.randomUUID();
  setSurveyId(id);

  const survey_link = `${baseUrl}/survey/${id}`;
  const survey_iframe = `<iframe src="${survey_link}" style="width:100%; height:360px; border:none;"></iframe>`;
  const survey_widget = generateWidgetCode(id, question, type, optionArray());
  const survey_script = `<div id="oneq-${id}"></div><script>(function(){var w=document.getElementById('oneq-${id}');if(!w)return;w.innerHTML=${JSON.stringify(survey_widget)};})();</script>`;

  const reactComp = generateReactComponent(id, question, type, optionArray(), themeColor);

  // Save React snippet in state
  setReactComponent(reactComp);

  const payload = {
    id,
    question,
    type,
    color: themeColor,
    survey_link,
    survey_iframe,
    survey_script,
    survey_widget,
    survey_react_component: reactComp,
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
  const iframeEmbed = surveyId ? `<iframe src="${previewLink}" style="width:100%; height:360px; border:none;"></iframe>` : "";
  const scriptEmbed = surveyId ? `<div id="oneq-${surveyId}"></div>\n<script>\n(function(){var w=document.getElementById('oneq-${surveyId}');if(!w)return;w.innerHTML=${JSON.stringify(generateWidgetCode(surveyId, question, type, optionArray()))};})();\n</script>` : "";
  const widgetEmbed = surveyId ? generateWidgetCode(surveyId, question, type, optionArray()) : "";

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
    <div className="min-h-screen w-full bg-gray-50 p-6">
      {!openForm ? (
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-semibold text-gray-900">Create Survey</h1>
            <Button 
              onClick={() => setOpenForm(true)} 
              size="sm"
              className="gap-2"
            >
              <Plus size={16} />
              Create new
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {surveyExamples.map((example, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setType(example.type as typeof type);
                  setQuestion(example.question);
                  if (example.type === "multiple") {
                    setOptions(example.options.join(", "));
                  }
                  setOpenForm(true);
                }}
                className="group relative bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 hover:shadow-md transition-all text-left"
              >
                <div className="aspect-square bg-gray-50 rounded mb-3 flex items-center justify-center overflow-hidden">
                  <div className="scale-75 transform">
                    {example.type === "yesno" && (
                      <div className="flex gap-1">
                        <div className="w-12 h-8 bg-gray-200 rounded"></div>
                        <div className="w-12 h-8 bg-gray-200 rounded"></div>
                      </div>
                    )}
                    {example.type === "multiple" && (
                      <div className="space-y-1">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="w-24 h-6 bg-gray-200 rounded"></div>
                        ))}
                      </div>
                    )}
                    {example.type === "rating" && (
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div key={i} className="w-6 h-6 bg-gray-200 rounded"></div>
                        ))}
                      </div>
                    )}
                    {example.type === "emoji" && (
                      <div className="flex gap-1 text-xl">
                        {example.options.map((e, i) => (
                          <span key={i}>{e}</span>
                        ))}
                      </div>
                    )}
                    {example.type === "text" && (
                      <div className="w-28 h-8 bg-gray-200 rounded"></div>
                    )}
                  </div>
                </div>
                <div className="text-xs font-medium text-gray-700 capitalize">{example.type === "yesno" ? "Yes/No" : example.type}</div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[400px,1fr] gap-6">
          {/* Left Sidebar - Form */}
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setOpenForm(false)}
                className="text-gray-600"
              >
                ← Back
              </Button>
            </div>

            <Card className="border-l-4" style={{ borderLeftColor: themeColor }}>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Survey Settings</CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                <div>
                  <Label className="text-xs">Question</Label>
                  <Input
                    placeholder="Ask something..."
                    value={question}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setQuestion(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label className="text-xs">Type</Label>
                  <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
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
                    <Textarea
                      placeholder="Red, Blue, Green"
                      value={options}
                      onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setOptions(e.target.value)}
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                )}

                <div>
                  <Label className="text-xs">Theme Color</Label>
                  <input
                    type="color"
                    value={themeColor}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setThemeColor(e.target.value)}
                    className="w-full h-10 rounded cursor-pointer border mt-1"
                  />
                </div>

                <div className="pt-2">
                  <Button onClick={handleSubmit} className="w-full" disabled={loading}>
                    {loading ? "Creating…" : created ? "Created ✓" : "Create Survey"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Side - Large Preview */}
          <div className="lg:sticky lg:top-6 h-fit">
            <div className="space-y-4">
              <Card className="border-2 shadow-xl">
                <CardContent className="p-12">
                  <div className="max-w-xl mx-auto">
                    {question.trim() ? (
                      <div dangerouslySetInnerHTML={{ __html: generateLivePreview() }} />
                    ) : (
                      <div className="text-center text-gray-400 py-12">
                        <div className="text-sm">Enter a question to see preview</div>
                      </div>
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
                    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="w-full">
  <TabsList className="grid grid-cols-5 gap-1 mb-3">
    <TabsTrigger value="widget">Widget</TabsTrigger>
    <TabsTrigger value="link">Link</TabsTrigger>
    <TabsTrigger value="iframe">iFrame</TabsTrigger>
    <TabsTrigger value="script">Script</TabsTrigger>
  <TabsTrigger value="react">React</TabsTrigger>
  </TabsList>

<TabsContent value="react" className="space-y-2">
  <div className="flex gap-2">
    <Textarea readOnly rows={12} value={surveyId ? reactComponent : ''} className="font-mono text-xs" />
    <Button variant="outline" size="icon" onClick={() => doCopy(reactComponent, "react")}>
      {copiedField === "react" ? <Check size={16} /> : <Copy size={16} />}
    </Button>
  </div>
</TabsContent>


  <TabsContent value="widget" className="space-y-2">
    <div className="flex gap-2">
      <Textarea
        readOnly
        rows={4}
        value={widgetEmbed}
        className="font-mono text-xs"
      />
      <Button variant="outline" size="icon" onClick={() => doCopy(widgetEmbed, "widget")}>
        {copiedField === "widget" ? <Check size={16} /> : <Copy size={16} />}
      </Button>
    </div>
  </TabsContent>

  <TabsContent value="link" className="space-y-2">
    {activeTab === "link" ? (
      <iframe src={previewLink} style={{ width: "100%", height: 360, border: "none" }} />
    ) : (
      <div className="flex gap-2">
        <Input readOnly value={previewLink} className="font-mono text-xs" />
        <Button variant="outline" size="icon" onClick={() => doCopy(previewLink, "link")}>
          {copiedField === "link" ? <Check size={16} /> : <Copy size={16} />}
        </Button>
      </div>
    )}
  </TabsContent>

  <TabsContent value="iframe" className="space-y-2">
    {activeTab === "iframe" && surveyId && (
      <iframe src={previewLink} style={{ width: "100%", height: 360, border: "none" }} />
    )}
    <div className="flex gap-2">
      <Textarea readOnly rows={2} value={iframeEmbed} className="font-mono text-xs" />
      <Button variant="outline" size="icon" onClick={() => doCopy(iframeEmbed, "iframe")}>
        {copiedField === "iframe" ? <Check size={16} /> : <Copy size={16} />}
      </Button>
    </div>
  </TabsContent>

  <TabsContent value="script" className="space-y-2">
    <div className="flex gap-2">
      <Textarea readOnly rows={4} value={scriptEmbed} className="font-mono text-xs" />
      <Button variant="outline" size="icon" onClick={() => doCopy(scriptEmbed, "script")}>
        {copiedField === "script" ? <Check size={16} /> : <Copy size={16} />}
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