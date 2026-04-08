import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PROMPTS: Record<string, { system: string; tool: any }> = {
  final_score: {
    system: `You are an AFL scorecard reader. Extract the final scores, quarter-by-quarter scores from this image.
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
  "confidence": "high" | "medium" | "low"
}
If a field is unreadable, use null. Quarter scores should be in format "goals.behinds.total" (e.g. "3.2.20"). The home team is typically listed first/on top.`,
    tool: {
      name: "extract_final_score",
      description: "Extract AFL final scores and quarter scores from an image",
      parameters: {
        type: "object",
        properties: {
          home_goals: { type: "number" },
          home_behinds: { type: "number" },
          away_goals: { type: "number" },
          away_behinds: { type: "number" },
          home_q1: { type: "string", nullable: true },
          home_q2: { type: "string", nullable: true },
          home_q3: { type: "string", nullable: true },
          home_q4: { type: "string", nullable: true },
          away_q1: { type: "string", nullable: true },
          away_q2: { type: "string", nullable: true },
          away_q3: { type: "string", nullable: true },
          away_q4: { type: "string", nullable: true },
          confidence: { type: "string", enum: ["high", "medium", "low"] },
        },
        required: ["home_goals", "home_behinds", "away_goals", "away_behinds", "confidence"],
      },
    },
  },
  match_stats: {
    system: `You are an AFL match stats reader. Extract team statistics from this image. This may be the top half or bottom half of the stats sheet.
Return ONLY valid JSON (no markdown). Extract as many of these stats as visible:
{
  "home_team_stats": {
    "disposals": <number|null>, "kicks": <number|null>, "handballs": <number|null>,
    "tackles": <number|null>, "marks": <number|null>, "contested_marks": <number|null>,
    "intercept_marks": <number|null>, "spoils": <number|null>, "inside_50s": <number|null>,
    "rebound_50s": <number|null>, "hitouts": <number|null>, "clearances": <number|null>,
    "contested_possessions": <number|null>, "uncontested_possessions": <number|null>,
    "frees_for": <number|null>, "frees_against": <number|null>, "fifty_m_penalties": <number|null>
  },
  "away_team_stats": { ... same fields ... },
  "confidence": "high" | "medium" | "low"
}
Only include stats you can clearly read. Use null for unreadable values. The home team is typically on the left or listed first.`,
    tool: {
      name: "extract_match_stats",
      description: "Extract AFL team match statistics from an image",
      parameters: {
        type: "object",
        properties: {
          home_team_stats: {
            type: "object",
            properties: {
              disposals: { type: "number", nullable: true },
              kicks: { type: "number", nullable: true },
              handballs: { type: "number", nullable: true },
              tackles: { type: "number", nullable: true },
              marks: { type: "number", nullable: true },
              contested_marks: { type: "number", nullable: true },
              intercept_marks: { type: "number", nullable: true },
              spoils: { type: "number", nullable: true },
              inside_50s: { type: "number", nullable: true },
              rebound_50s: { type: "number", nullable: true },
              hitouts: { type: "number", nullable: true },
              clearances: { type: "number", nullable: true },
              contested_possessions: { type: "number", nullable: true },
              uncontested_possessions: { type: "number", nullable: true },
              frees_for: { type: "number", nullable: true },
              frees_against: { type: "number", nullable: true },
              fifty_m_penalties: { type: "number", nullable: true },
            },
          },
          away_team_stats: {
            type: "object",
            properties: {
              disposals: { type: "number", nullable: true },
              kicks: { type: "number", nullable: true },
              handballs: { type: "number", nullable: true },
              tackles: { type: "number", nullable: true },
              marks: { type: "number", nullable: true },
              contested_marks: { type: "number", nullable: true },
              intercept_marks: { type: "number", nullable: true },
              spoils: { type: "number", nullable: true },
              inside_50s: { type: "number", nullable: true },
              rebound_50s: { type: "number", nullable: true },
              hitouts: { type: "number", nullable: true },
              clearances: { type: "number", nullable: true },
              contested_possessions: { type: "number", nullable: true },
              uncontested_possessions: { type: "number", nullable: true },
              frees_for: { type: "number", nullable: true },
              frees_against: { type: "number", nullable: true },
              fifty_m_penalties: { type: "number", nullable: true },
            },
          },
          confidence: { type: "string", enum: ["high", "medium", "low"] },
        },
        required: ["home_team_stats", "away_team_stats", "confidence"],
      },
    },
  },
  key_stats: {
    system: `You are an AFL key stats reader. Extract individual player statistics from this image, specifically goalkickers, disposals leaders, and AFL Fantasy scores.
Return ONLY valid JSON (no markdown):
{
  "goal_kickers_home": ["Player Name goals", ...],
  "goal_kickers_away": ["Player Name goals", ...],
  "player_stats": [
    {
      "name": "Player Name",
      "team": "home" | "away",
      "goals": <number|null>,
      "behinds": <number|null>,
      "disposals": <number|null>,
      "kicks": <number|null>,
      "handballs": <number|null>,
      "marks": <number|null>,
      "tackles": <number|null>,
      "hitouts": <number|null>,
      "afl_fantasy": <number|null>
    }
  ],
  "confidence": "high" | "medium" | "low"
}
Extract all players visible. Use null for stats not shown.`,
    tool: {
      name: "extract_key_stats",
      description: "Extract AFL player key statistics from an image",
      parameters: {
        type: "object",
        properties: {
          goal_kickers_home: { type: "array", items: { type: "string" } },
          goal_kickers_away: { type: "array", items: { type: "string" } },
          player_stats: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                team: { type: "string", enum: ["home", "away"] },
                goals: { type: "number", nullable: true },
                behinds: { type: "number", nullable: true },
                disposals: { type: "number", nullable: true },
                kicks: { type: "number", nullable: true },
                handballs: { type: "number", nullable: true },
                marks: { type: "number", nullable: true },
                tackles: { type: "number", nullable: true },
                hitouts: { type: "number", nullable: true },
                afl_fantasy: { type: "number", nullable: true },
              },
              required: ["name", "team"],
            },
          },
          confidence: { type: "string", enum: ["high", "medium", "low"] },
        },
        required: ["confidence"],
      },
    },
  },
  cricket_scorecard: {
    system: `You are a cricket scorecard reader. Extract ALL data from this cricket scorecard image. This could be a full scorecard, batting card, bowling figures, or a summary.

Extract as much as possible from the image:
- Innings totals (runs, wickets, overs, extras)
- Batting details for each batter (name, runs, balls, 4s, 6s, how out, bowler)
- Bowling figures for each bowler (name, overs, maidens, runs, wickets, wides, no-balls)

IMPORTANT:
- Extract ALL batters and bowlers visible, not just highlights
- "not out" means the batter was not dismissed
- Common dismissals: bowled, caught, lbw, run out, stumped, hit wicket, retired
- If there are multiple innings visible, extract all of them
- The batting team and bowling team are different teams`,
    tool: {
      name: "extract_cricket_scorecard",
      description: "Extract cricket scorecard data from an image",
      parameters: {
        type: "object",
        properties: {
          innings: {
            type: "array",
            items: {
              type: "object",
              properties: {
                team_name: { type: "string" },
                innings_number: { type: "number" },
                total_runs: { type: "number", nullable: true },
                total_wickets: { type: "number", nullable: true },
                total_overs: { type: "number", nullable: true },
                extras: { type: "number", nullable: true },
                all_out: { type: "boolean" },
                declared: { type: "boolean" },
                batting: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      runs: { type: "number", nullable: true },
                      balls: { type: "number", nullable: true },
                      fours: { type: "number", nullable: true },
                      sixes: { type: "number", nullable: true },
                      how_out: { type: "string", nullable: true },
                      bowler: { type: "string", nullable: true },
                      not_out: { type: "boolean" },
                    },
                    required: ["name"],
                  },
                },
                bowling: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      overs: { type: "number", nullable: true },
                      maidens: { type: "number", nullable: true },
                      runs: { type: "number", nullable: true },
                      wickets: { type: "number", nullable: true },
                      wides: { type: "number", nullable: true },
                      no_balls: { type: "number", nullable: true },
                    },
                    required: ["name"],
                  },
                },
              },
              required: ["team_name", "innings_number"],
            },
          },
          confidence: { type: "string", enum: ["high", "medium", "low"] },
        },
        required: ["innings", "confidence"],
      },
    },
  },
};
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrl, extractionType } = await req.json();
    if (!imageUrl) {
      return new Response(JSON.stringify({ error: "imageUrl is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const type = extractionType || "final_score";
    const prompt = PROMPTS[type];
    if (!prompt) {
      return new Response(JSON.stringify({ error: "Invalid extraction type" }), {
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
          { role: "system", content: prompt.system },
          {
            role: "user",
            content: [
              { type: "text", text: "Please extract all relevant data from this AFL stats image." },
              { type: "image_url", image_url: { url: imageUrl } },
            ],
          },
        ],
        tools: [{ type: "function", function: prompt.tool }],
        tool_choice: { type: "function", function: { name: prompt.tool.name } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again shortly" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI error:", response.status, text);
      return new Response(JSON.stringify({ error: "AI processing failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResult = await response.json();

    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      const extracted = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify({ ...extracted, extractionType: type }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const content = aiResult.choices?.[0]?.message?.content ?? "";
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const extracted = JSON.parse(jsonMatch[0]);
      return new Response(JSON.stringify({ ...extracted, extractionType: type }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Could not parse AI response" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("extract-scorecard error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
