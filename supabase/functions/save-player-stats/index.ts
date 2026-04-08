import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

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
    const { fixture_id, player_stats } = await req.json();

    if (!fixture_id || !player_stats || !Array.isArray(player_stats) || player_stats.length === 0) {
      return new Response(JSON.stringify({ error: "fixture_id and player_stats array required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Get fixture to know team IDs
    const { data: fixture, error: fixErr } = await supabase
      .from("fixtures")
      .select("home_team_id, away_team_id")
      .eq("id", fixture_id)
      .single();

    if (fixErr || !fixture) {
      return new Response(JSON.stringify({ error: "Fixture not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const insertedStats = [];

    for (const ps of player_stats) {
      const { name, team, goals, behinds, disposals, kicks, handballs, marks, tackles, hitouts, afl_fantasy } = ps;
      if (!name || !team) continue;

      const teamId = team === "home" ? fixture.home_team_id : fixture.away_team_id;

      // Parse name into first/last
      const parts = name.trim().split(/\s+/);
      const lastName = parts.length > 1 ? parts.pop()! : parts[0];
      const firstName = parts.join(" ") || lastName;

      // Try to find existing player on this team
      let { data: existingPlayer } = await supabase
        .from("players")
        .select("id")
        .eq("team_id", teamId)
        .ilike("last_name", lastName)
        .limit(1)
        .single();

      let playerId: string;

      if (existingPlayer) {
        playerId = existingPlayer.id;
      } else {
        // Create player
        const { data: newPlayer, error: createErr } = await supabase
          .from("players")
          .insert({ first_name: firstName, last_name: lastName, team_id: teamId })
          .select("id")
          .single();

        if (createErr || !newPlayer) {
          console.error("Failed to create player:", name, createErr);
          continue;
        }
        playerId = newPlayer.id;
      }

      // Upsert match player stats
      const { error: statsErr } = await supabase
        .from("match_player_stats")
        .upsert(
          {
            fixture_id,
            player_id: playerId,
            team_id: teamId,
            goals: goals ?? 0,
            behinds: behinds ?? 0,
            disposals: disposals ?? 0,
            kicks: kicks ?? 0,
            handballs: handballs ?? 0,
            marks: marks ?? 0,
            tackles: tackles ?? 0,
            hitouts: hitouts ?? 0,
            afl_fantasy: afl_fantasy ?? 0,
          },
          { onConflict: "fixture_id,player_id" }
        );

      if (statsErr) {
        console.error("Failed to upsert stats for", name, statsErr);
        // Try insert without onConflict
        await supabase.from("match_player_stats").insert({
          fixture_id,
          player_id: playerId,
          team_id: teamId,
          goals: goals ?? 0,
          behinds: behinds ?? 0,
          disposals: disposals ?? 0,
          kicks: kicks ?? 0,
          handballs: handballs ?? 0,
          marks: marks ?? 0,
          tackles: tackles ?? 0,
          hitouts: hitouts ?? 0,
          afl_fantasy: afl_fantasy ?? 0,
        });
      }

      insertedStats.push({ name, playerId });
    }

    return new Response(
      JSON.stringify({ success: true, count: insertedStats.length, players: insertedStats }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("save-player-stats error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
