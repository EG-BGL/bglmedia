import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableKey) throw new Error("LOVABLE_API_KEY not configured");

    const sb = createClient(supabaseUrl, supabaseKey);

    // Get the 5 most recent approved results with match details
    const { data: results, error: rErr } = await sb
      .from("results")
      .select(`
        id, home_score, away_score, home_goals, home_behinds, away_goals, away_behinds, match_notes,
        fixtures!inner(
          id, round_number, venue,
          home_team:teams!fixtures_home_team_id_fkey(clubs(name, short_name)),
          away_team:teams!fixtures_away_team_id_fkey(clubs(name, short_name)),
          seasons(name, competitions(name, short_name, sports(slug)))
        )
      `)
      .eq("status", "approved")
      .order("approved_at", { ascending: false })
      .limit(5);

    if (rErr) throw rErr;
    if (!results || results.length === 0) {
      return new Response(JSON.stringify({ articles: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build match summaries for the AI, keeping fixture_id for linking
    const fixtureIds = results.map((r: any) => r.fixtures?.id);
    const matchSummaries = results.map((r: any) => {
      const f = r.fixtures;
      const home = f.home_team?.clubs?.name ?? "Home";
      const away = f.away_team?.clubs?.name ?? "Away";
      const sport = f.seasons?.competitions?.sports?.slug ?? "afl";
      const isAfl = sport === "afl";
      const winner = r.home_score > r.away_score ? home : r.away_score > r.home_score ? away : null;
      const margin = Math.abs((r.home_score ?? 0) - (r.away_score ?? 0));

      return {
        home,
        away,
        homeScore: r.home_score,
        awayScore: r.away_score,
        sport: isAfl ? "AFL" : "Cricket",
        round: f.round_number,
        venue: f.venue,
        season: f.seasons?.name,
        competition: f.seasons?.competitions?.short_name || f.seasons?.competitions?.name,
        winner,
        margin,
        aflDetail: isAfl ? `${r.home_goals}.${r.home_behinds} to ${r.away_goals}.${r.away_behinds}` : null,
      };
    });

    const prompt = `You are a sports journalist for a local community sports competition called BGLMedia. Write short, exciting news articles about these recent match results. Write in an Australian sports journalism style — punchy, enthusiastic, and community-focused.

For each match, write a JSON object with:
- "headline": A catchy, short headline (max 12 words)
- "summary": A 2-3 sentence match report (max 80 words). Mention the teams, the score, the margin, and the venue if available. Add some colour and excitement.
- "sport": "AFL" or "Cricket"

Here are the matches:
${JSON.stringify(matchSummaries, null, 2)}

Return a JSON object with an "articles" array containing one article per match. Only return valid JSON, no markdown.`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are a local community sports journalist. Return only valid JSON." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, try again later" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResp.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${aiResp.status}`);
    }

    const aiData = await aiResp.json();
    let content = aiData.choices?.[0]?.message?.content ?? "";
    
    // Strip markdown code fences if present
    content = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

    let articles;
    try {
      const parsed = JSON.parse(content);
      const rawArticles = parsed.articles ?? parsed;
      // Attach fixture_id to each article by index
      articles = (Array.isArray(rawArticles) ? rawArticles : []).map((a: any, idx: number) => ({
        ...a,
        fixture_id: fixtureIds[idx] ?? null,
      }));
    } catch {
      articles = [];
    }

    return new Response(JSON.stringify({ articles }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-match-news error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
