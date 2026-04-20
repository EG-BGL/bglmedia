import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface LiveMatchState {
  fixture_id: string;
  home_goals: number;
  home_behinds: number;
  away_goals: number;
  away_behinds: number;
  home_q1: string | null; home_q2: string | null; home_q3: string | null; home_q4: string | null;
  away_q1: string | null; away_q2: string | null; away_q3: string | null; away_q4: string | null;
  current_quarter: number;
  quarter_status: string;
  quarter_started_at: string | null;
  match_status: string;
}

export interface LiveGoalEvent {
  id: string;
  fixture_id: string;
  team_id: string;
  player_id: string | null;
  quarter: number;
  is_goal: boolean;
  scored_at: string;
}

export function useLiveMatch(fixtureId?: string) {
  const [state, setState] = useState<LiveMatchState | null>(null);
  const [events, setEvents] = useState<LiveGoalEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!fixtureId) { setLoading(false); return; }
    let cancelled = false;

    const load = async () => {
      const [{ data: s }, { data: e }] = await Promise.all([
        supabase.from("live_match_state").select("*").eq("fixture_id", fixtureId).maybeSingle(),
        supabase.from("live_goal_events").select("*").eq("fixture_id", fixtureId).order("scored_at", { ascending: false }),
      ]);
      if (cancelled) return;
      setState(s as LiveMatchState | null);
      setEvents((e ?? []) as LiveGoalEvent[]);
      setLoading(false);
    };
    load();

    const channel = supabase
      .channel(`live-match-${fixtureId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "live_match_state", filter: `fixture_id=eq.${fixtureId}` },
        (payload) => {
          if (payload.eventType === "DELETE") setState(null);
          else setState(payload.new as LiveMatchState);
        })
      .on("postgres_changes", { event: "*", schema: "public", table: "live_goal_events", filter: `fixture_id=eq.${fixtureId}` },
        () => { load(); })
      .subscribe();

    return () => { cancelled = true; supabase.removeChannel(channel); };
  }, [fixtureId]);

  return { state, events, loading, isLive: state?.match_status === "live" };
}

export function useAnyLiveAFLMatch() {
  const [liveFixtureId, setLiveFixtureId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const { data } = await supabase
        .from("live_match_state")
        .select("fixture_id, fixtures!inner(match_format)")
        .eq("match_status", "live")
        .limit(1);
      if (cancelled) return;
      const row = (data ?? [])[0] as { fixture_id: string } | undefined;
      setLiveFixtureId(row?.fixture_id ?? null);
    };
    load();

    const channel = supabase
      .channel("any-live-match")
      .on("postgres_changes", { event: "*", schema: "public", table: "live_match_state" }, () => load())
      .subscribe();

    return () => { cancelled = true; supabase.removeChannel(channel); };
  }, []);

  return liveFixtureId;
}
