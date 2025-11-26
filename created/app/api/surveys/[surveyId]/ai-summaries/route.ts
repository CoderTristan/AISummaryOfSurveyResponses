// app/api/surveys/[surveyId]/generate-summary/route.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createSupaClient } from "@/lib/supabaseClient"; 

const API_KEY = process.env.AI_API_KEY;
const AI_COST_PER_1K = parseFloat(process.env.AI_COST_PER_1K || "0.02"); 

function estimateTokensForText(text: string) {
  if (!text) return 0;
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words * 1.5));
}

export async function POST(request: NextRequest, { params }: { params: { surveyId: string } }) {
  if (!API_KEY) {
    return NextResponse.json({ error: "AI_API_KEY not configured" }, { status: 500 });
  }

  const { surveyId } = params;
  const supabase = createSupaClient();

  // Load survey and responses
  const { data: survey, error: surveyError } = await supabase
    .from("surveys")
    .select("id, question, type, owner_id")
    .eq("id", surveyId)
    .single();

  if (surveyError || !survey) {
    return NextResponse.json({ error: "Survey not found" }, { status: 404 });
  }

  const { data: responses, error: respError } = await supabase
    .from("responses")
    .select("answer, created_at")
    .eq("survey_id", surveyId)
    .order("created_at", { ascending: false });

  if (respError) {
    console.error("Failed to load responses:", respError);
    return NextResponse.json({ error: "Failed to load responses" }, { status: 500 });
  }


  if (!responses || responses.length === 0) {
  return NextResponse.json(
    { error: "This survey has no responses — cannot generate a summary." },
    { status: 400 }
  );
}
  // Build prompt
  const MAX_ITEMS = 200;
  const answers = (responses || []).slice(0, MAX_ITEMS).map((r: any) => String(r.answer || ""));
  
  const prompt = `
You are a helpful assistant. Given the survey question and a list of responses, produce:
1) A short summary (2-4 concise paragraphs) describing common themes and notable points.
2) A sentiment score between -1.0 (very negative) and +1.0 (very positive) representing the overall sentiment.
3) A short list of 3 suggested action items (1 sentence each) the survey owner could take based on responses.

Return a JSON object exactly like:
{
  "summary": "...",
  "sentiment": 0.12,
  "actions": ["...","...","..."]
}

Do not include any additional text outside the JSON.

Question: ${survey.question}

Responses (most recent first):
${answers.map((a, i) => `${i + 1}. ${a}`).join("\n")}
`;

  // Estimate tokens & cost
  const promptTokens = estimateTokensForText(prompt);
  const expectedCompletionTokens = 350;
  const totalEstimatedTokens = promptTokens + expectedCompletionTokens;
  const estimatedCost = (totalEstimatedTokens / 1000) * AI_COST_PER_1K;

  // Load user and check balance
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("id, balance")
    .eq("id", survey.owner_id)
    .single();

  if (userError || !user) {
    return NextResponse.json({ error: "Survey owner not found" }, { status: 404 });
  }

  if (user.balance < estimatedCost) {
    return NextResponse.json({ error: "Insufficient tokens for AI generation" }, { status: 400 });
  }

  // Deduct tokens immediately
  const { error: deductError } = await supabase
    .from("users")
    .update({ balance: user.balance - estimatedCost })
    .eq("id", user.id);

  if (deductError) {
    console.error("Failed to deduct tokens:", deductError);
    return NextResponse.json({ error: "Failed to deduct tokens" }, { status: 500 });
  }

  // Call AI API
  try {
    const resp = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-goog-api-key": API_KEY,
      },
      body: JSON.stringify({
        contents: [
          { role: "user", parts: [{ text: prompt }] }
        ],
      }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      console.error("AI response error:", resp.status, text);
      return NextResponse.json({ error: "AI call failed", detail: text }, { status: 502 });
    }

    const data = await resp.json();
    const content = data?.choices?.[0]?.message?.content || data?.choices?.[0]?.text || "";
    let parsed: { summary?: string; sentiment?: number; actions?: string[] } = {};

    try {
      const jsonStart = content.indexOf("{");
      const jsonString = jsonStart >= 0 ? content.slice(jsonStart) : content;
      parsed = JSON.parse(jsonString);
    } catch {
      parsed.summary = String(content).slice(0, 2000);
      parsed.sentiment = 0;
      parsed.actions = [];
    }

    const finalSummary = parsed.summary ?? "";
    const finalSentiment = typeof parsed.sentiment === "number" ? parsed.sentiment : 0;

    // Update survey
    const { error: updateError } = await supabase
      .from("surveys")
      .update({ ai_summary: finalSummary, ai_sentiment: finalSentiment, ai_actions: parsed.actions || [] })
      .eq("id", surveyId);

    if (updateError) {
      console.error("Failed to update surveys.ai_summary:", updateError);
      return NextResponse.json({
        success: true,
        warning: "Generated but failed to save summary",
        generated: { summary: finalSummary, sentiment: finalSentiment, actions: parsed.actions || [] },
        estimate: { tokens: totalEstimatedTokens, cost: estimatedCost },
      });
    }

    return NextResponse.json({
      success: true,
      generated: { summary: finalSummary, sentiment: finalSentiment, actions: parsed.actions || [] },
      estimate: { tokens: totalEstimatedTokens, cost: estimatedCost },
    });

  } catch (err) {
    console.error("Error generating summary:", err);
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}
