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

    // Load ALL roster players for both teams upfront
    const { data: rosterPlayers } = await supabase
      .from("players")
      .select("id, first_name, last_name, team_id, jersey_number")
      .in("team_id", [fixture.home_team_id, fixture.away_team_id]);

    const roster = rosterPlayers ?? [];

    // Build lookup: normalize last name -> roster players
    const rosterByLastName = new Map<string, typeof roster>();
    for (const p of roster) {
      const key = p.last_name.trim().toLowerCase();
      if (!rosterByLastName.has(key)) rosterByLastName.set(key, []);
      rosterByLastName.get(key)!.push(p);
    }

    // Delete existing stats for this fixture to avoid duplicates on re-submission
    await supabase.from("match_player_stats").delete().eq("fixture_id", fixture_id);

    const insertedStats = [];

    // De-duplicate player_stats by name+team (keep last occurrence which has merged data)
    const deduped = new Map<string, typeof player_stats[0]>();
    for (const ps of player_stats) {
      if (!ps.name || !ps.team) continue;
      const key = `${ps.name.trim().toLowerCase()}::${ps.team}`;
      deduped.set(key, ps);
    }

    // Track which roster player IDs we've already used to prevent double-mapping
    const usedPlayerIds = new Set<string>();

    for (const ps of deduped.values()) {
      const { name, team, goals, behinds, disposals, kicks, handballs, marks, tackles, hitouts, afl_fantasy } = ps;

      const teamId = team === "home" ? fixture.home_team_id : fixture.away_team_id;

      // Parse name into last name for matching
      const parts = name.trim().split(/\s+/);
      const lastName = parts.length > 1 ? parts.pop()! : parts[0];
      const firstInitialOrName = parts.join(" ") || "";

      // Find roster player by last name match
      const normalizedLast = lastName.toLowerCase();
      const candidates = rosterByLastName.get(normalizedLast) ?? [];

      let matchedPlayer: typeof roster[0] | null = null;

      // 1. Prefer player on the correct team with jersey number (real roster player)
      for (const c of candidates) {
        if (c.team_id === teamId && c.jersey_number != null && !usedPlayerIds.has(c.id)) {
          matchedPlayer = c;
          break;
        }
      }

      // 2. Fall back to any player on the correct team
      if (!matchedPlayer) {
        for (const c of candidates) {
          if (c.team_id === teamId && !usedPlayerIds.has(c.id)) {
            matchedPlayer = c;
            break;
          }
        }
      }

      // 3. Fall back to player on either team with jersey number (real roster player)
      if (!matchedPlayer) {
        for (const c of candidates) {
          if (c.jersey_number != null && !usedPlayerIds.has(c.id)) {
            matchedPlayer = c;
            break;
          }
        }
      }

      // 4. Fall back to any player with this last name
      if (!matchedPlayer) {
        for (const c of candidates) {
          if (!usedPlayerIds.has(c.id)) {
            matchedPlayer = c;
            break;
          }
        }
      }

      let playerId: string;

      if (matchedPlayer) {
        playerId = matchedPlayer.id;
        // Use the matched player's actual team_id for the stats record
      } else {
        // No roster match found - create player on the correct team
        const firstName = firstInitialOrName || lastName;
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

      usedPlayerIds.add(playerId);

      // Insert match player stats - use the player's actual team
      const actualTeamId = matchedPlayer?.team_id ?? teamId;
      const { error: statsErr } = await supabase
        .from("match_player_stats")
        .upsert(
          {
            fixture_id,
            player_id: playerId,
            team_id: actualTeamId,
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
        continue;
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
