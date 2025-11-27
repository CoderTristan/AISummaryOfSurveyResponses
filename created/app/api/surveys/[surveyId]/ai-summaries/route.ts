import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createSupaClient } from "@/lib/supabaseClient";
import { supabaseAdmin } from "@/lib/supabase-admin";

const API_KEY = process.env.AI_API_KEY;
const AI_COST_PER_1K = parseFloat(process.env.AI_COST_PER_1K || "0.02");

// Simple, approximate token estimator (kept for billing)
function estimateTokensForText(text: string) {
  if (!text) return 0;
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words * 1.5));
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ surveyId: string }> }
) {
  if (!API_KEY) {
    return NextResponse.json(
      { error: "AI_API_KEY not configured" },
      { status: 500 }
    );
  }

  const { surveyId } = await params;
  const supabase = createSupaClient();

  // Load survey
  const { data: survey, error: surveyError } = await supabase
    .from("surveys")
    .select("id, question, type, user_id")
    .eq("id", surveyId)
    .single();

  if (surveyError || !survey) {
    return NextResponse.json({ error: "Survey not found" }, { status: 404 });
  }

  // Load responses
  const { data: responses, error: respError } = await supabase
    .from("responses")
    .select("answer, created_at")
    .eq("survey_id", surveyId)
    .order("created_at", { ascending: false });

  if (respError) {
    console.error("Failed to load responses:", respError);
    return NextResponse.json(
      { error: "Failed to load responses" },
      { status: 500 }
    );
  }

  if (!responses || responses.length === 0) {
    return NextResponse.json(
      {
        error: "This survey has no responses — cannot generate a summary.",
      },
      { status: 400 }
    );
  }

  // Build prompt
  const MAX_ITEMS = 200;
  const answers = responses.slice(0, MAX_ITEMS).map((r) => String(r.answer));

  const prompt = `
You are a helpful assistant. Given the survey question and a list of responses, produce:
1) A short summary (2–4 concise paragraphs)
2) A sentiment score between -1.0 and +1.0
3) A short list of 3 action items

Return ONLY JSON like:
{
  "summary": "...",
  "sentiment": 0.12,
  "actions": ["...","...","..."]
}

Question: ${survey.question}

Responses:
${answers.map((a, i) => `${i + 1}. ${a}`).join("\n")}
`;

  // --- Estimated token billing (unchanged) ---
  const promptTokens = estimateTokensForText(prompt);
  const expectedCompletionTokens = 350;
  const totalEstimatedTokens = promptTokens + expectedCompletionTokens;
  const estimatedCost = (totalEstimatedTokens / 1000) * AI_COST_PER_1K;

  // Load user via ADMIN client
  const { data: user, error: userError } = await supabaseAdmin
    .from("users")
    .select("id, balance")
    .eq("clerk_id", survey.user_id)
    .single();

  if (userError || !user) {
    return NextResponse.json(
      { error: "Survey owner not found" },
      { status: 404 }
    );
  }

  // Check balance
  if (user.balance < estimatedCost) {
    return NextResponse.json(
      { error: "Insufficient tokens for AI generation" },
      { status: 400 }
    );
  }

  // Deduct immediately (same behavior as before)
  const { error: deductError } = await supabaseAdmin
    .from("users")
    .update({ balance: user.balance - estimatedCost })
    .eq("id", user.id);

  if (deductError) {
    console.error("Failed to deduct tokens:", deductError);
    return NextResponse.json(
      { error: "Failed to deduct tokens" },
      { status: 500 }
    );
  }

  // --- Call Gemini ---
  try {
    const resp = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-goog-api-key": API_KEY,
        },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
        }),
      }
    );

    if (!resp.ok) {
      const text = await resp.text();
      console.error("AI response error:", resp.status, text);
      return NextResponse.json(
        { error: "AI call failed", detail: text },
        { status: 502 }
      );
    }

    const data = await resp.json();

    // --- REAL TOKEN USAGE ---
    const realPromptTokens = data?.usageMetadata?.promptTokenCount ?? null;
    const realCompletionTokens =
      data?.usageMetadata?.candidatesTokenCount ?? null;
    const realTotalTokens =
      realPromptTokens && realCompletionTokens
        ? realPromptTokens + realCompletionTokens
        : null;

    const realCost =
      realTotalTokens !== null
        ? (realTotalTokens / 1000) * AI_COST_PER_1K
        : estimatedCost;

    // Convert Gemini's returned dollar cost → approximate token count
// Example: 0.000081 → 81 tokens
    let realTokenApprox = null;
    if (realCost != null) {
      realTokenApprox = Math.round(realCost * 1_000_000);
    }


    // ===============================================================
    // ⭐ IMPROVED JSON EXTRACTION (the ONLY part changed)
    // ===============================================================
    const raw =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ??
      data?.choices?.[0]?.text ??
      "";

    let parsed: { summary?: string; sentiment?: number; actions?: string[] } =
      {};

    try {
      // remove code fences if present
      let cleaned = raw
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .trim();

      // extract the first { ... }
      const first = cleaned.indexOf("{");
      const last = cleaned.lastIndexOf("}");
      if (first !== -1 && last !== -1) {
        cleaned = cleaned.slice(first, last + 1);
      }

      parsed = JSON.parse(cleaned);
    } catch {
      parsed.summary = String(raw).slice(0, 2000);
      parsed.sentiment = 0;
      parsed.actions = [];
    }

    // Guarantee required fields exist
    const finalSummary = parsed.summary ?? "";
    const finalSentiment =
      typeof parsed.sentiment === "number" ? parsed.sentiment : 0;
    const finalActions = Array.isArray(parsed.actions) ? parsed.actions : [];

    // Save to DB
    const { error: updateError } = await supabase
      .from("surveys")
      .update({
        ai_summary: finalSummary,
        ai_sentiment: finalSentiment,
        ai_actions: finalActions,
      })
      .eq("id", surveyId);

    if (updateError) {
      console.error("Failed to update surveys.ai_summary:", updateError);
      return NextResponse.json({
        success: true,
        warning: "Generated but failed to save summary",
        generated: {
          summary: finalSummary,
          sentiment: finalSentiment,
          actions: finalActions,
        },
        estimate: {
          tokens: realTotalTokens ?? totalEstimatedTokens,
          cost: realCost,
        },
      });
    }

    return NextResponse.json({
  success: true,
  generated: {
    summary: finalSummary,
    sentiment: finalSentiment,
    actions: finalActions,
  },
  estimate: {
    tokens: realTotalTokens ?? totalEstimatedTokens,
    cost: realCost,
    usedPrompt: realPromptTokens,
    usedCompletion: realCompletionTokens,
  },
});

  } catch (err) {
    console.error("Error generating summary:", err);
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}
