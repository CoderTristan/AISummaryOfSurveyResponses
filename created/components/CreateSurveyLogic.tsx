"use client";

import { useState, useEffect, ChangeEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { createSurvey, getSurveys } from "@/lib/supabaseSurveys";
import { useSubscription } from "@/hooks/use-sub";
import { PLAN_LIMITS } from "@/lib/plans";

export function useCreateSurveyLogic() {
  const router = useRouter();
  const params = useParams();

  const projectId =
    Array.isArray(params.projectId) && params.projectId.length > 0
      ? params.projectId[0]
      : (params.projectId as string | undefined);

  const subscription = useSubscription();
  const plan = subscription?.plan || "free";
  const maxSurveys = PLAN_LIMITS[plan.toLowerCase()]?.surveys ?? 3;

  const [surveys, setSurveys] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"widget" | "link" | "iframe" | "script" | "react">(
    "widget"
  );

  const [question, setQuestion] = useState("");
  const [type, setType] = useState<"yesno" | "multiple" | "rating" | "emoji" | "text">("yesno");
  const [options, setOptions] = useState("");
  const [themeColor, setThemeColor] = useState("#6366f1");

  const [surveyId, setSurveyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState(false);
  const [openForm, setOpenForm] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const [reactComponent, setReactComponent] = useState("");

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL;

  // -------------------------
  // Load Existing Surveys
  // -------------------------
  useEffect(() => {
    const load = async () => {
      if (!projectId) return;
      const existing = await getSurveys(projectId);
      setSurveys(existing || []);
    };
    load();
  }, [projectId]);

  // -------------------------
  // Helpers
  // -------------------------
  const optionArray = () =>
    options.split(",").map((s) => s.trim()).filter(Boolean);

  // --- HTML widget generator ---
  const generateWidgetCode = (id: string, q: string, t: typeof type, opts: string[]) => {
    const escapeHtml = (s: string) =>
      String(s)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");

    const buttonStyle = `border:2px solid ${themeColor}; border-radius:.5rem; padding:.75rem 1rem; font-weight:600; cursor:pointer; transition:0.15s; background:white;`;
    const hover = `this.style.background='${themeColor}'; this.style.color='white';`;
    const reset = `this.style.background='white'; this.style.color='${themeColor}';`;

    const renderOptionsHtml = () => {
      if (t === "yesno") {
        return `
          <div style="display:flex;gap:8px;justify-content:center;">
            <button style="${buttonStyle}" onmouseover="${hover}" onmouseout="${reset}" data-value="yes">Yes</button>
            <button style="${buttonStyle}" onmouseover="${hover}" onmouseout="${reset}" data-value="no">No</button>
          </div>`;
      }

      if (t === "multiple" && opts.length) {
        return `
          <div style="display:flex;flex-direction:column;gap:8px;">
            ${opts
              .map(
                (o) =>
                  `<button style="${buttonStyle}" onmouseover="${hover}" onmouseout="${reset}" data-value="${escapeHtml(
                    o
                  )}">${escapeHtml(o)}</button>`
              )
              .join("")}
          </div>`;
      }

      if (t === "rating") {
        return `
          <div style="display:flex;gap:8px;justify-content:center;">
            ${[1, 2, 3, 4, 5]
              .map(
                (n) =>
                  `<button style="${buttonStyle}" onmouseover="${hover}" onmouseout="${reset}" data-value="${n}">${n}</button>`
              )
              .join("")}
          </div>`;
      }

      if (t === "emoji") {
        const emojis = ["😡", "😕", "😐", "🙂", "🤩"];
        return `
          <div style="display:flex;gap:8px;justify-content:center;">
            ${emojis
              .map(
                (e) =>
                  `<button style="${buttonStyle}" onmouseover="${hover}" onmouseout="${reset}" data-value="${encodeURIComponent(
                    e
                  )}">${e}</button>`
              )
              .join("")}
          </div>`;
      }

      return `<textarea style="width:100%; padding:.75rem; border:2px solid ${themeColor}; border-radius:.5rem;" placeholder="Type your answer…"></textarea>`;
    };

    return `
<div id="oneq-${id}" style="font-family:Inter; background:white; border-radius:1rem; border:2px solid ${themeColor}33; max-width:400px; margin:auto; padding:2rem; display:flex; flex-direction:column; gap:1rem; text-align:center;">
  <div style="font-weight:600; font-size:1.25rem;">${escapeHtml(q)}</div>
  ${renderOptionsHtml()}
  <button id="oneq-submit" style="background:${themeColor}; color:white; border:none; border-radius:.5rem; padding:.75rem 1rem; font-weight:600; cursor:pointer;">Submit</button>
  <div id="oneq-thanks" style="font-size:.75rem; color:#6b7280; margin-top:.5rem; display:none;">Thanks for responding!</div>
</div>

<script>
(function(){
  const c = document.getElementById('oneq-${id}');
  let ans = null;

  c.querySelectorAll('button[data-value]').forEach(btn => {
    btn.addEventListener('click', () => {
      ans = btn.getAttribute('data-value');
      c.querySelectorAll('button[data-value]').forEach(b => {
        b.style.background='white'; b.style.color='${themeColor}';
      });
      btn.style.background='${themeColor}'; btn.style.color='white';
    });
  });

  const txt = c.querySelector('textarea');
  if(txt){
    txt.addEventListener('input', e => ans = txt.value);
  }

  c.querySelector('#oneq-submit').addEventListener('click', async () => {
    if(!ans) return;
    await fetch('${baseUrl}/api/surveys/${id}/responses', {
      method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({answer:ans})
    });
    c.querySelector('#oneq-thanks').style.display='block';
  });
})();
</script>`;
  };

  const generateLivePreview = () => {
    if (!question.trim()) return "";
    return generateWidgetCode("preview", question, type, optionArray());
  };

  // React Component generator (same as before)
  const generateReactComponent = (
    id: string,
    q: string,
    t: typeof type,
    opts: string[],
    color: string
  ) => {
    const options = opts.map((o) => JSON.stringify(o)).join(", ");

    return `'use client';

import { useState, ChangeEvent } from "react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";

export default function OneQWidget() {
  const [answer, setAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const submit = async () => {
    if (!answer) return;
    await fetch("${baseUrl}/api/surveys/${id}/responses", {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ answer })
    });
    setSubmitted(true);
  };

  if (submitted) return <div>Thanks for responding!</div>;

  return (
    <div className="p-6 max-w-md mx-auto">
      <div className="mb-4 font-semibold text-lg">${q}</div>
      ${
        t === "multiple"
          ? `{[${options}].map(o => (
        <Button key={o} onClick={() => setAnswer(o)} style={{borderColor:"${color}", backgroundColor: answer===o ? "${color}" : "white", color: answer===o ? "white" : "${color}"}}>
          {o}
        </Button>
      ))}`
          : `<Textarea value={answer} onChange={(e)=>setAnswer(e.target.value)} style={{borderColor:"${color}"}} />`
      }
      <Button onClick={submit} className="mt-4 w-full" style={{ backgroundColor:"${color}", color:"white" }}>Submit</Button>
    </div>
  );
}`;
  };

  // -------------------------
  // Submit logic
  // -------------------------
  const handleSubmit = async () => {
    if (surveys.length >= maxSurveys) {
      alert(`You cannot create more than ${maxSurveys} surveys on the ${plan} plan.`);
      return;
    }

    if (!question.trim()) return;
    setLoading(true);
    setCreated(false);

    const id = crypto.randomUUID();
    setSurveyId(id);

    const survey_link = `${baseUrl}/survey/${id}`;

    const survey_widget = generateWidgetCode(id, question, type, optionArray());
    const iframeEmbed = `<iframe src="${survey_link}" style="width:100%; height:360px; border:none;"></iframe>`;
    const scriptEmbed = `<div id="oneq-${id}"></div><script>(function(){var w=document.getElementById('oneq-${id}');if(!w)return;w.innerHTML=${JSON.stringify(
      survey_widget
    )};})();</script>`;

    const reactComp = generateReactComponent(id, question, type, optionArray(), themeColor);
    setReactComponent(reactComp);

    try {
      await createSurvey({
        id,
        question,
        type,
        color: themeColor,
        survey_link,
        survey_iframe: iframeEmbed,
        survey_script: scriptEmbed,
        survey_widget,
        survey_react_component: reactComp,
        options: type === "multiple" ? optionArray() : null,
        project_id: projectId ?? undefined,
      });

      setCreated(true);
      router.refresh();
    } catch (err) {
      alert("Failed to create survey");
    } finally {
      setLoading(false);
    }
  };

  // -------------------------
  // Copy
  // -------------------------
  const doCopy = async (text: string, name: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(name);
      setTimeout(() => setCopiedField(null), 1500);
    } catch {
      alert("Copy failed");
    }
  };

  // -------------------------
  // Output props for UI
  // -------------------------
  return {
    // state
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
    copiedField,
    reactComponent,

    // computed
    previewLink: surveyId ? `${baseUrl}/survey/${surveyId}` : "",
    iframeEmbed: surveyId
      ? `<iframe src="${baseUrl}/survey/${surveyId}" style="width:100%; height:360px; border:none;"></iframe>`
      : "",
    scriptEmbed: surveyId
      ? `<div id="oneq-${surveyId}"></div><script>(function(){var w=document.getElementById('oneq-${surveyId}');if(!w)return;w.innerHTML=${JSON.stringify(
          generateWidgetCode(surveyId, question, type, optionArray())
        )};})();</script>`
      : "",
    widgetEmbed: surveyId
      ? generateWidgetCode(surveyId, question, type, optionArray())
      : "",
    livePreview: generateLivePreview(),

    // handlers
    handleSubmit,
    doCopy,
  };
}
