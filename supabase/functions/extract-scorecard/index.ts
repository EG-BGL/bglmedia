import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrl } = await req.json();
    if (!imageUrl) {
      return new Response(JSON.stringify({ error: "imageUrl is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are an AFL scorecard reader. Extract scores from the scorecard image.
Return ONLY valid JSON with this exact structure (no markdown, no code fences):
{
  "home_goals": <number>,
  "home_behinds": <number>,
  "away_goals": <number>,
  "away_behinds": <number>,
  "home_q1": "<goals.behinds.total>",
  "home_q2": "<goals.behinds.total>",
  "home_q3": "<goals.behinds.total>",
  "home_q4": "<goals.behinds.total>",
  "away_q1": "<goals.behinds.total>",
  "away_q2": "<goals.behinds.total>",
  "away_q3": "<goals.behinds.total>",
  "away_q4": "<goals.behinds.total>",
  "best_players_home": ["name1", "name2"],
  "best_players_away": ["name1", "name2"],
  "goal_kickers_home": ["name goals", "name goals"],
  "goal_kickers_away": ["name goals", "name goals"],
  "confidence": "high" | "medium" | "low"
}
If a field is unreadable, use null. Quarter scores should be in format "goals.behinds.total" (e.g. "3.2.20"). The home team is typically listed first/on top. If you can't read the scorecard at all, return {"error": "Could not read scorecard"}.`,
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Please extract all scores and player information from this AFL scorecard image.",
              },
              {
                type: "image_url",
                image_url: { url: imageUrl },
              },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_scorecard",
              description: "Extract AFL scorecard data from an image",
              parameters: {
                type: "object",
                properties: {
                  home_goals: { type: "number", description: "Home team total goals" },
                  home_behinds: { type: "number", description: "Home team total behinds" },
                  away_goals: { type: "number", description: "Away team total goals" },
                  away_behinds: { type: "number", description: "Away team total behinds" },
                  home_q1: { type: "string", nullable: true },
                  home_q2: { type: "string", nullable: true },
                  home_q3: { type: "string", nullable: true },
                  home_q4: { type: "string", nullable: true },
                  away_q1: { type: "string", nullable: true },
                  away_q2: { type: "string", nullable: true },
                  away_q3: { type: "string", nullable: true },
                  away_q4: { type: "string", nullable: true },
                  best_players_home: { type: "array", items: { type: "string" } },
                  best_players_away: { type: "array", items: { type: "string" } },
                  goal_kickers_home: { type: "array", items: { type: "string" } },
                  goal_kickers_away: { type: "array", items: { type: "string" } },
                  confidence: { type: "string", enum: ["high", "medium", "low"] },
                },
                required: ["home_goals", "home_behinds", "away_goals", "away_behinds", "confidence"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_scorecard" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again shortly" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI error:", response.status, text);
      return new Response(JSON.stringify({ error: "AI processing failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResult = await response.json();
    
    // Extract from tool call response
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      const extracted = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify(extracted), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fallback: try parsing content directly
    const content = aiResult.choices?.[0]?.message?.content ?? "";
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const extracted = JSON.parse(jsonMatch[0]);
      return new Response(JSON.stringify(extracted), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Could not parse AI response" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("extract-scorecard error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
