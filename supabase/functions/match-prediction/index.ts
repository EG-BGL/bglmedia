import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { homeTeam, awayTeam, homeLadder, awayLadder, result, isCricket, matchFormat } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const isCompleted = !!result;

    // Build context about the match
    let matchContext = `Sport: ${isCricket ? 'Cricket' : 'AFL'}\n`;
    if (matchFormat) matchContext += `Format: ${matchFormat}\n`;
    matchContext += `Home Team: ${homeTeam}\n`;
    matchContext += `Away Team: ${awayTeam}\n`;

    if (homeLadder) {
      matchContext += `\n${homeTeam} Season Stats: ${homeLadder.wins}W ${homeLadder.losses}L ${homeLadder.draws}D, ${homeLadder.played} played, ${homeLadder.competition_points} pts, ${homeLadder.points_for} points for, ${homeLadder.points_against} points against, ${Number(homeLadder.percentage).toFixed(1)}%\n`;
    }
    if (awayLadder) {
      matchContext += `${awayTeam} Season Stats: ${awayLadder.wins}W ${awayLadder.losses}L ${awayLadder.draws}D, ${awayLadder.played} played, ${awayLadder.competition_points} pts, ${awayLadder.points_for} points for, ${awayLadder.points_against} points against, ${Number(awayLadder.percentage).toFixed(1)}%\n`;
    }

    let prompt: string;
    if (isCompleted) {
      matchContext += `\nFinal Score: ${homeTeam} ${result.homeScore} - ${awayTeam} ${result.awayScore}\n`;
      if (result.homeGoals !== undefined) {
        matchContext += `(${homeTeam}: ${result.homeGoals}.${result.homeBehinds}, ${awayTeam}: ${result.awayGoals}.${result.awayBehinds})\n`;
      }
      prompt = `Based on the following match data, provide a brief post-match analysis. Who won and why? What were the key factors? Keep it to 2-3 sentences, punchy and insightful like a sports commentator.\n\n${matchContext}`;
    } else {
      prompt = `Based on the following season stats, predict who will win this upcoming match and explain why in 2-3 sentences. Be confident and give a bold prediction like a sports analyst. If there's no ladder data, give a fun neutral prediction.\n\n${matchContext}`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: "You are an enthusiastic Australian sports analyst for a local community league. Base your predictions and analysis ONLY on the season statistics provided (wins, losses, points for, points against, percentage, etc). Do NOT use any real-world knowledge about these team names - they are local community clubs, not professional teams. Give short, punchy predictions or post-match analysis. Use Australian slang occasionally. Never use markdown formatting. Keep responses to 2-3 sentences maximum.",
          },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI prediction unavailable" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const prediction = data.choices?.[0]?.message?.content ?? "No prediction available.";

    return new Response(JSON.stringify({ prediction, isCompleted }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("prediction error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
