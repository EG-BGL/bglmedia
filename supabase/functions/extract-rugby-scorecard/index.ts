import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PROMPTS: Record<string, { system: string; tool: any }> = {
  rugby_scoreboard: {
    system: `You are a Rugby League scoreboard reader. Extract final scores and try/conversion/penalty/field-goal breakdown from this image. Standard NRL scoring: try=4, conversion=2, penalty goal=2, field goal=1.
Return totals for both teams. Home team is typically listed first/on top/on the left.
Use null for any value you cannot read.`,
    tool: {
      name: "extract_rugby_scoreboard",
      description: "Extract Rugby League final scores from an image",
      parameters: {
        type: "object",
        properties: {
          home: {
            type: "object",
            properties: {
              total_points: { type: "number", nullable: true },
              tries: { type: "number", nullable: true },
              conversions: { type: "number", nullable: true },
              penalty_goals: { type: "number", nullable: true },
              field_goals: { type: "number", nullable: true },
              half_time_points: { type: "number", nullable: true },
            },
          },
          away: {
            type: "object",
            properties: {
              total_points: { type: "number", nullable: true },
              tries: { type: "number", nullable: true },
              conversions: { type: "number", nullable: true },
              penalty_goals: { type: "number", nullable: true },
              field_goals: { type: "number", nullable: true },
              half_time_points: { type: "number", nullable: true },
            },
          },
          confidence: { type: "string", enum: ["high", "medium", "low"] },
        },
        required: ["home", "away", "confidence"],
      },
    },
  },
  rugby_team_stats: {
    system: `You are a Rugby League team stats reader. Extract team-level statistics from this image (run metres, line breaks, tackles, missed tackles, errors, penalties conceded, sets completed, possession %).
Use null for unreadable fields. Home team is typically on the left or first.`,
    tool: {
      name: "extract_rugby_team_stats",
      description: "Extract Rugby League team statistics from an image",
      parameters: {
        type: "object",
        properties: {
          home_team_stats: {
            type: "object",
            properties: {
              run_metres: { type: "number", nullable: true },
              line_breaks: { type: "number", nullable: true },
              tackles: { type: "number", nullable: true },
              missed_tackles: { type: "number", nullable: true },
              errors: { type: "number", nullable: true },
              penalties_conceded: { type: "number", nullable: true },
              sets_completed: { type: "number", nullable: true },
              sets_total: { type: "number", nullable: true },
              possession_pct: { type: "number", nullable: true },
            },
          },
          away_team_stats: {
            type: "object",
            properties: {
              run_metres: { type: "number", nullable: true },
              line_breaks: { type: "number", nullable: true },
              tackles: { type: "number", nullable: true },
              missed_tackles: { type: "number", nullable: true },
              errors: { type: "number", nullable: true },
              penalties_conceded: { type: "number", nullable: true },
              sets_completed: { type: "number", nullable: true },
              sets_total: { type: "number", nullable: true },
              possession_pct: { type: "number", nullable: true },
            },
          },
          confidence: { type: "string", enum: ["high", "medium", "low"] },
        },
        required: ["home_team_stats", "away_team_stats", "confidence"],
      },
    },
  },
  rugby_player_stats: {
    system: `You are a Rugby League player stats reader. Extract individual player stats from this image.
For each player, capture as many of: tries, try assists, line breaks, runs, run metres, tackle busts, offloads, tackles, missed tackles, errors, conversions, penalty goals, field goals, kick metres, penalties conceded, sin bins, send offs, position, minutes played.
Decide which team each player is on (home or away). Use null for any unreadable stat.`,
    tool: {
      name: "extract_rugby_player_stats",
      description: "Extract Rugby League player statistics from an image",
      parameters: {
        type: "object",
        properties: {
          player_stats: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                team: { type: "string", enum: ["home", "away"] },
                position: { type: "string", nullable: true },
                minutes_played: { type: "number", nullable: true },
                tries: { type: "number", nullable: true },
                try_assists: { type: "number", nullable: true },
                line_breaks: { type: "number", nullable: true },
                runs: { type: "number", nullable: true },
                run_metres: { type: "number", nullable: true },
                tackle_busts: { type: "number", nullable: true },
                offloads: { type: "number", nullable: true },
                tackles: { type: "number", nullable: true },
                missed_tackles: { type: "number", nullable: true },
                errors: { type: "number", nullable: true },
                conversions: { type: "number", nullable: true },
                penalty_goals: { type: "number", nullable: true },
                field_goals: { type: "number", nullable: true },
                kick_metres: { type: "number", nullable: true },
                penalties_conceded: { type: "number", nullable: true },
                sin_bins: { type: "number", nullable: true },
                send_offs: { type: "number", nullable: true },
              },
              required: ["name", "team"],
            },
          },
          confidence: { type: "string", enum: ["high", "medium", "low"] },
        },
        required: ["player_stats", "confidence"],
      },
    },
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { imageUrl, extractionType } = await req.json();
    if (!imageUrl) {
      return new Response(JSON.stringify({ error: "imageUrl is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const type = extractionType || "rugby_scoreboard";
    const prompt = PROMPTS[type];
    if (!prompt) {
      return new Response(JSON.stringify({ error: "Invalid extraction type" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: prompt.system },
          {
            role: "user",
            content: [
              { type: "text", text: "Please extract all relevant data from this Rugby League image." },
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
    return new Response(JSON.stringify({ error: "Could not parse AI response" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("extract-rugby-scorecard error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
