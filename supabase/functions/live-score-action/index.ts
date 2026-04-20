import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type Action =
  | { type: "init" }
  | { type: "start_match" }
  | { type: "start_quarter" }
  | { type: "end_quarter" }
  | { type: "end_match" }
  | { type: "add_goal"; team: "home" | "away"; player_id?: string | null }
  | { type: "add_behind"; team: "home" | "away"; player_id?: string | null }
  | { type: "undo_last" };

function quarterString(g: number, b: number) {
  return `${g}.${b}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authHeader = req.headers.get("Authorization") ?? "";

    // Verify caller
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    const body = await req.json();
    const fixture_id: string = body.fixture_id;
    const action: Action = body.action;
    if (!fixture_id || !action) {
      return new Response(JSON.stringify({ error: "fixture_id and action required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceKey);

    // Permission check
    const { data: canScore } = await admin.rpc("can_score_fixture", {
      _user_id: userId, _fixture_id: fixture_id,
    });
    if (!canScore) {
      return new Response(JSON.stringify({ error: "Not authorised to score this match" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Load or create live state
    let { data: state } = await admin
      .from("live_match_state")
      .select("*")
      .eq("fixture_id", fixture_id)
      .maybeSingle();

    if (!state) {
      const { data: created, error: createErr } = await admin
        .from("live_match_state")
        .insert({ fixture_id })
        .select("*")
        .single();
      if (createErr) throw createErr;
      state = created;
    }

    const { data: fixture } = await admin
      .from("fixtures")
      .select("home_team_id, away_team_id")
      .eq("id", fixture_id)
      .single();
    if (!fixture) throw new Error("Fixture not found");

    const updates: Record<string, unknown> = {};
    let eventInsert: Record<string, unknown> | null = null;

    switch (action.type) {
      case "init":
        break;

      case "start_match":
        updates.match_status = "live";
        updates.quarter_status = "in_progress";
        updates.quarter_started_at = new Date().toISOString();
        updates.current_quarter = state.current_quarter ?? 1;
        // Mark fixture in_progress
        await admin.from("fixtures").update({ status: "in_progress" }).eq("id", fixture_id);
        break;

      case "start_quarter":
        updates.quarter_status = "in_progress";
        updates.quarter_started_at = new Date().toISOString();
        if (state.match_status !== "live") updates.match_status = "live";
        break;

      case "end_quarter": {
        updates.quarter_status = "break";
        const next = Math.min((state.current_quarter ?? 1) + 1, 4);
        updates.current_quarter = next;
        break;
      }

      case "end_match": {
        updates.match_status = "finished";
        updates.quarter_status = "finished";
        // Apply updates THEN finalise
        await admin.from("live_match_state").update(updates).eq("fixture_id", fixture_id);
        await admin.rpc("finalise_live_match", { p_fixture_id: fixture_id });
        const { data: finalState } = await admin
          .from("live_match_state").select("*").eq("fixture_id", fixture_id).single();
        return new Response(JSON.stringify({ ok: true, state: finalState }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "add_goal":
      case "add_behind": {
        const isGoal = action.type === "add_goal";
        const team = action.team;
        const teamId = team === "home" ? fixture.home_team_id : fixture.away_team_id;
        const goalsField = `${team}_goals` as const;
        const behindsField = `${team}_behinds` as const;

        if (isGoal) updates[goalsField] = (state[goalsField] ?? 0) + 1;
        else updates[behindsField] = (state[behindsField] ?? 0) + 1;

        // Update quarter string
        const q = state.current_quarter ?? 1;
        const newG = isGoal ? (state[goalsField] ?? 0) + 1 : (state[goalsField] ?? 0);
        const newB = !isGoal ? (state[behindsField] ?? 0) + 1 : (state[behindsField] ?? 0);
        // We want quarter-by-quarter cumulative; store running cumulative in q field
        const qField = `${team}_q${q}` as const;
        updates[qField] = quarterString(newG, newB);

        eventInsert = {
          fixture_id, team_id: teamId,
          player_id: action.player_id ?? null,
          quarter: q, is_goal: isGoal,
          created_by: userId,
        };
        break;
      }

      case "undo_last": {
        // Find last event
        const { data: last } = await admin
          .from("live_goal_events")
          .select("*")
          .eq("fixture_id", fixture_id)
          .order("scored_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (!last) {
          return new Response(JSON.stringify({ ok: true, message: "Nothing to undo" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const team = last.team_id === fixture.home_team_id ? "home" : "away";
        const goalsField = `${team}_goals` as const;
        const behindsField = `${team}_behinds` as const;
        if (last.is_goal) updates[goalsField] = Math.max(0, (state[goalsField] ?? 0) - 1);
        else updates[behindsField] = Math.max(0, (state[behindsField] ?? 0) - 1);

        const q = last.quarter ?? state.current_quarter ?? 1;
        const newG = last.is_goal ? Math.max(0, (state[goalsField] ?? 0) - 1) : (state[goalsField] ?? 0);
        const newB = !last.is_goal ? Math.max(0, (state[behindsField] ?? 0) - 1) : (state[behindsField] ?? 0);
        const qField = `${team}_q${q}` as const;
        updates[qField] = quarterString(newG, newB);

        await admin.from("live_goal_events").delete().eq("id", last.id);
        break;
      }
    }

    if (Object.keys(updates).length > 0) {
      const { error: upErr } = await admin
        .from("live_match_state").update(updates).eq("fixture_id", fixture_id);
      if (upErr) throw upErr;
    }

    if (eventInsert) {
      await admin.from("live_goal_events").insert(eventInsert);
    }

    const { data: finalState } = await admin
      .from("live_match_state").select("*").eq("fixture_id", fixture_id).single();

    return new Response(JSON.stringify({ ok: true, state: finalState }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("live-score-action error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
