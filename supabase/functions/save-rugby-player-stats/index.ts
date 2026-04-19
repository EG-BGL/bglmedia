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
    const { fixture_id, player_stats } = await req.json();
    if (!fixture_id || !player_stats || !Array.isArray(player_stats) || player_stats.length === 0) {
      return new Response(JSON.stringify({ error: "fixture_id and player_stats array required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: fixture, error: fixErr } = await supabase
      .from("fixtures")
      .select("home_team_id, away_team_id")
      .eq("id", fixture_id)
      .single();

    if (fixErr || !fixture) {
      return new Response(JSON.stringify({ error: "Fixture not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: rosterPlayers } = await supabase
      .from("players")
      .select("id, first_name, last_name, team_id, jersey_number")
      .in("team_id", [fixture.home_team_id, fixture.away_team_id]);

    const roster = rosterPlayers ?? [];
    const rosterByLastName = new Map<string, typeof roster>();
    for (const p of roster) {
      const key = p.last_name.trim().toLowerCase();
      if (!rosterByLastName.has(key)) rosterByLastName.set(key, []);
      rosterByLastName.get(key)!.push(p);
    }

    await supabase.from("rugby_player_stats").delete().eq("fixture_id", fixture_id);

    const deduped = new Map<string, typeof player_stats[0]>();
    for (const ps of player_stats) {
      if (!ps.name || !ps.team) continue;
      const key = `${ps.name.trim().toLowerCase()}::${ps.team}`;
      deduped.set(key, ps);
    }

    const usedPlayerIds = new Set<string>();
    const inserted: any[] = [];

    for (const ps of deduped.values()) {
      const teamId = ps.team === "home" ? fixture.home_team_id : fixture.away_team_id;
      const parts = ps.name.trim().split(/\s+/);
      const lastName = parts.length > 1 ? parts.pop()! : parts[0];
      const firstInitialOrName = parts.join(" ") || "";

      const candidates = rosterByLastName.get(lastName.toLowerCase()) ?? [];
      let matched: typeof roster[0] | null = null;
      for (const c of candidates) {
        if (c.team_id === teamId && c.jersey_number != null && !usedPlayerIds.has(c.id)) { matched = c; break; }
      }
      if (!matched) {
        for (const c of candidates) {
          if (c.team_id === teamId && !usedPlayerIds.has(c.id)) { matched = c; break; }
        }
      }
      if (!matched) {
        for (const c of candidates) {
          if (!usedPlayerIds.has(c.id)) { matched = c; break; }
        }
      }

      let playerId: string;
      if (matched) {
        playerId = matched.id;
      } else {
        const firstName = firstInitialOrName || lastName;
        const { data: newPlayer } = await supabase
          .from("players")
          .insert({ first_name: firstName, last_name: lastName, team_id: teamId })
          .select("id").single();
        if (!newPlayer) continue;
        playerId = newPlayer.id;
      }
      usedPlayerIds.add(playerId);

      const actualTeamId = matched?.team_id ?? teamId;
      const { error } = await supabase.from("rugby_player_stats").upsert({
        fixture_id, player_id: playerId, team_id: actualTeamId,
        position: ps.position ?? null,
        minutes_played: ps.minutes_played ?? 0,
        tries: ps.tries ?? 0,
        try_assists: ps.try_assists ?? 0,
        line_breaks: ps.line_breaks ?? 0,
        runs: ps.runs ?? 0,
        run_metres: ps.run_metres ?? 0,
        tackle_busts: ps.tackle_busts ?? 0,
        offloads: ps.offloads ?? 0,
        tackles: ps.tackles ?? 0,
        missed_tackles: ps.missed_tackles ?? 0,
        errors: ps.errors ?? 0,
        conversions: ps.conversions ?? 0,
        penalty_goals: ps.penalty_goals ?? 0,
        field_goals: ps.field_goals ?? 0,
        kick_metres: ps.kick_metres ?? 0,
        penalties_conceded: ps.penalties_conceded ?? 0,
        sin_bins: ps.sin_bins ?? 0,
        send_offs: ps.send_offs ?? 0,
      }, { onConflict: "fixture_id,player_id" });

      if (error) { console.error("upsert err", ps.name, error); continue; }
      inserted.push({ name: ps.name, playerId });
    }

    return new Response(JSON.stringify({ success: true, count: inserted.length, players: inserted }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("save-rugby-player-stats error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
