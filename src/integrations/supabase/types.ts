export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          new_data: Json | null
          old_data: Json | null
          performed_by: string | null
          record_id: string | null
          table_name: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          performed_by?: string | null
          record_id?: string | null
          table_name: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          performed_by?: string | null
          record_id?: string | null
          table_name?: string
        }
        Relationships: []
      }
      clubs: {
        Row: {
          coach: string | null
          contact_email: string | null
          created_at: string
          description: string | null
          founded_year: number | null
          home_ground: string | null
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
          primary_color: string | null
          secondary_color: string | null
          short_name: string
          updated_at: string
        }
        Insert: {
          coach?: string | null
          contact_email?: string | null
          created_at?: string
          description?: string | null
          founded_year?: number | null
          home_ground?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name: string
          primary_color?: string | null
          secondary_color?: string | null
          short_name: string
          updated_at?: string
        }
        Update: {
          coach?: string | null
          contact_email?: string | null
          created_at?: string
          description?: string | null
          founded_year?: number | null
          home_ground?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          primary_color?: string | null
          secondary_color?: string | null
          short_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      coach_achievements: {
        Row: {
          awarded_by: string | null
          badge_type: string
          created_at: string
          id: string
          notes: string | null
          season_id: string | null
          sport_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          awarded_by?: string | null
          badge_type: string
          created_at?: string
          id?: string
          notes?: string | null
          season_id?: string | null
          sport_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          awarded_by?: string | null
          badge_type?: string
          created_at?: string
          id?: string
          notes?: string | null
          season_id?: string | null
          sport_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_achievements_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_achievements_sport_id_fkey"
            columns: ["sport_id"]
            isOneToOne: false
            referencedRelation: "sports"
            referencedColumns: ["id"]
          },
        ]
      }
      coaches_to_teams: {
        Row: {
          created_at: string
          id: string
          is_primary: boolean | null
          season_id: string
          team_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_primary?: boolean | null
          season_id: string
          team_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_primary?: boolean | null
          season_id?: string
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coaches_to_teams_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coaches_to_teams_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      competitions: {
        Row: {
          competition_type: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          short_name: string | null
          sport_id: string | null
          updated_at: string
        }
        Insert: {
          competition_type?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          short_name?: string | null
          sport_id?: string | null
          updated_at?: string
        }
        Update: {
          competition_type?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          short_name?: string | null
          sport_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "competitions_sport_id_fkey"
            columns: ["sport_id"]
            isOneToOne: false
            referencedRelation: "sports"
            referencedColumns: ["id"]
          },
        ]
      }
      cricket_match_results: {
        Row: {
          all_out: boolean | null
          created_at: string
          declared: boolean | null
          extras: number | null
          extras_breakdown: Json | null
          fixture_id: string
          follow_on: boolean | null
          id: string
          innings_number: number
          run_rate: number | null
          team_id: string
          total_overs: number | null
          total_runs: number | null
          total_wickets: number | null
          updated_at: string
        }
        Insert: {
          all_out?: boolean | null
          created_at?: string
          declared?: boolean | null
          extras?: number | null
          extras_breakdown?: Json | null
          fixture_id: string
          follow_on?: boolean | null
          id?: string
          innings_number?: number
          run_rate?: number | null
          team_id: string
          total_overs?: number | null
          total_runs?: number | null
          total_wickets?: number | null
          updated_at?: string
        }
        Update: {
          all_out?: boolean | null
          created_at?: string
          declared?: boolean | null
          extras?: number | null
          extras_breakdown?: Json | null
          fixture_id?: string
          follow_on?: boolean | null
          id?: string
          innings_number?: number
          run_rate?: number | null
          team_id?: string
          total_overs?: number | null
          total_runs?: number | null
          total_wickets?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cricket_match_results_fixture_id_fkey"
            columns: ["fixture_id"]
            isOneToOne: false
            referencedRelation: "fixtures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cricket_match_results_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      cricket_player_stats: {
        Row: {
          balls_faced: number | null
          bowler_name: string | null
          catches: number | null
          created_at: string
          economy: number | null
          fixture_id: string
          fours: number | null
          how_out: string | null
          id: string
          innings_number: number
          maidens: number | null
          no_balls: number | null
          not_out: boolean | null
          overs_bowled: number | null
          player_id: string
          run_outs: number | null
          runs_conceded: number | null
          runs_scored: number | null
          sixes: number | null
          strike_rate: number | null
          stumpings: number | null
          team_id: string
          updated_at: string
          wickets: number | null
          wides: number | null
        }
        Insert: {
          balls_faced?: number | null
          bowler_name?: string | null
          catches?: number | null
          created_at?: string
          economy?: number | null
          fixture_id: string
          fours?: number | null
          how_out?: string | null
          id?: string
          innings_number?: number
          maidens?: number | null
          no_balls?: number | null
          not_out?: boolean | null
          overs_bowled?: number | null
          player_id: string
          run_outs?: number | null
          runs_conceded?: number | null
          runs_scored?: number | null
          sixes?: number | null
          strike_rate?: number | null
          stumpings?: number | null
          team_id: string
          updated_at?: string
          wickets?: number | null
          wides?: number | null
        }
        Update: {
          balls_faced?: number | null
          bowler_name?: string | null
          catches?: number | null
          created_at?: string
          economy?: number | null
          fixture_id?: string
          fours?: number | null
          how_out?: string | null
          id?: string
          innings_number?: number
          maidens?: number | null
          no_balls?: number | null
          not_out?: boolean | null
          overs_bowled?: number | null
          player_id?: string
          run_outs?: number | null
          runs_conceded?: number | null
          runs_scored?: number | null
          sixes?: number | null
          strike_rate?: number | null
          stumpings?: number | null
          team_id?: string
          updated_at?: string
          wickets?: number | null
          wides?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cricket_player_stats_fixture_id_fkey"
            columns: ["fixture_id"]
            isOneToOne: false
            referencedRelation: "fixtures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cricket_player_stats_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cricket_player_stats_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      cricket_team_stats: {
        Row: {
          created_at: string
          extras: number | null
          fixture_id: string
          id: string
          innings_number: number
          partnership_highest: number | null
          run_rate: number | null
          team_id: string
          total_overs: number | null
          total_runs: number | null
          total_wickets: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          extras?: number | null
          fixture_id: string
          id?: string
          innings_number?: number
          partnership_highest?: number | null
          run_rate?: number | null
          team_id: string
          total_overs?: number | null
          total_runs?: number | null
          total_wickets?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          extras?: number | null
          fixture_id?: string
          id?: string
          innings_number?: number
          partnership_highest?: number | null
          run_rate?: number | null
          team_id?: string
          total_overs?: number | null
          total_runs?: number | null
          total_wickets?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cricket_team_stats_fixture_id_fkey"
            columns: ["fixture_id"]
            isOneToOne: false
            referencedRelation: "fixtures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cricket_team_stats_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      fixture_scorers: {
        Row: {
          assigned_by: string | null
          created_at: string
          fixture_id: string
          id: string
          user_id: string
        }
        Insert: {
          assigned_by?: string | null
          created_at?: string
          fixture_id: string
          id?: string
          user_id: string
        }
        Update: {
          assigned_by?: string | null
          created_at?: string
          fixture_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fixture_scorers_fixture_id_fkey"
            columns: ["fixture_id"]
            isOneToOne: false
            referencedRelation: "fixtures"
            referencedColumns: ["id"]
          },
        ]
      }
      fixtures: {
        Row: {
          away_team_id: string
          created_at: string
          home_team_id: string
          id: string
          is_locked: boolean | null
          match_format: string | null
          round_number: number
          scheduled_at: string | null
          season_id: string
          status: Database["public"]["Enums"]["fixture_status"] | null
          updated_at: string
          venue: string | null
        }
        Insert: {
          away_team_id: string
          created_at?: string
          home_team_id: string
          id?: string
          is_locked?: boolean | null
          match_format?: string | null
          round_number: number
          scheduled_at?: string | null
          season_id: string
          status?: Database["public"]["Enums"]["fixture_status"] | null
          updated_at?: string
          venue?: string | null
        }
        Update: {
          away_team_id?: string
          created_at?: string
          home_team_id?: string
          id?: string
          is_locked?: boolean | null
          match_format?: string | null
          round_number?: number
          scheduled_at?: string | null
          season_id?: string
          status?: Database["public"]["Enums"]["fixture_status"] | null
          updated_at?: string
          venue?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fixtures_away_team_id_fkey"
            columns: ["away_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fixtures_home_team_id_fkey"
            columns: ["home_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fixtures_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      ladder_entries: {
        Row: {
          competition_points: number | null
          created_at: string
          draws: number | null
          id: string
          losses: number | null
          percentage: number | null
          played: number | null
          points_against: number | null
          points_for: number | null
          position_change: number | null
          season_id: string
          team_id: string
          updated_at: string
          wins: number | null
        }
        Insert: {
          competition_points?: number | null
          created_at?: string
          draws?: number | null
          id?: string
          losses?: number | null
          percentage?: number | null
          played?: number | null
          points_against?: number | null
          points_for?: number | null
          position_change?: number | null
          season_id: string
          team_id: string
          updated_at?: string
          wins?: number | null
        }
        Update: {
          competition_points?: number | null
          created_at?: string
          draws?: number | null
          id?: string
          losses?: number | null
          percentage?: number | null
          played?: number | null
          points_against?: number | null
          points_for?: number | null
          position_change?: number | null
          season_id?: string
          team_id?: string
          updated_at?: string
          wins?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ladder_entries_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ladder_entries_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      live_goal_events: {
        Row: {
          created_by: string | null
          fixture_id: string
          id: string
          is_goal: boolean
          player_id: string | null
          quarter: number
          scored_at: string
          team_id: string
        }
        Insert: {
          created_by?: string | null
          fixture_id: string
          id?: string
          is_goal?: boolean
          player_id?: string | null
          quarter?: number
          scored_at?: string
          team_id: string
        }
        Update: {
          created_by?: string | null
          fixture_id?: string
          id?: string
          is_goal?: boolean
          player_id?: string | null
          quarter?: number
          scored_at?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_goal_events_fixture_id_fkey"
            columns: ["fixture_id"]
            isOneToOne: false
            referencedRelation: "fixtures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_goal_events_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_goal_events_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      live_match_state: {
        Row: {
          away_behinds: number
          away_goals: number
          away_q1: string | null
          away_q2: string | null
          away_q3: string | null
          away_q4: string | null
          created_at: string
          current_quarter: number
          fixture_id: string
          home_behinds: number
          home_goals: number
          home_q1: string | null
          home_q2: string | null
          home_q3: string | null
          home_q4: string | null
          match_status: string
          quarter_started_at: string | null
          quarter_status: string
          updated_at: string
        }
        Insert: {
          away_behinds?: number
          away_goals?: number
          away_q1?: string | null
          away_q2?: string | null
          away_q3?: string | null
          away_q4?: string | null
          created_at?: string
          current_quarter?: number
          fixture_id: string
          home_behinds?: number
          home_goals?: number
          home_q1?: string | null
          home_q2?: string | null
          home_q3?: string | null
          home_q4?: string | null
          match_status?: string
          quarter_started_at?: string | null
          quarter_status?: string
          updated_at?: string
        }
        Update: {
          away_behinds?: number
          away_goals?: number
          away_q1?: string | null
          away_q2?: string | null
          away_q3?: string | null
          away_q4?: string | null
          created_at?: string
          current_quarter?: number
          fixture_id?: string
          home_behinds?: number
          home_goals?: number
          home_q1?: string | null
          home_q2?: string | null
          home_q3?: string | null
          home_q4?: string | null
          match_status?: string
          quarter_started_at?: string | null
          quarter_status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_match_state_fixture_id_fkey"
            columns: ["fixture_id"]
            isOneToOne: true
            referencedRelation: "fixtures"
            referencedColumns: ["id"]
          },
        ]
      }
      match_player_stats: {
        Row: {
          afl_fantasy: number | null
          behinds: number | null
          created_at: string
          disposals: number | null
          fixture_id: string
          goals: number | null
          handballs: number | null
          hitouts: number | null
          id: string
          kicks: number | null
          marks: number | null
          player_id: string
          tackles: number | null
          team_id: string
          updated_at: string
        }
        Insert: {
          afl_fantasy?: number | null
          behinds?: number | null
          created_at?: string
          disposals?: number | null
          fixture_id: string
          goals?: number | null
          handballs?: number | null
          hitouts?: number | null
          id?: string
          kicks?: number | null
          marks?: number | null
          player_id: string
          tackles?: number | null
          team_id: string
          updated_at?: string
        }
        Update: {
          afl_fantasy?: number | null
          behinds?: number | null
          created_at?: string
          disposals?: number | null
          fixture_id?: string
          goals?: number | null
          handballs?: number | null
          hitouts?: number | null
          id?: string
          kicks?: number | null
          marks?: number | null
          player_id?: string
          tackles?: number | null
          team_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_player_stats_fixture_id_fkey"
            columns: ["fixture_id"]
            isOneToOne: false
            referencedRelation: "fixtures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_player_stats_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_player_stats_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      match_team_stats: {
        Row: {
          clearances: number | null
          contested_marks: number | null
          contested_possessions: number | null
          created_at: string
          disposals: number | null
          fifty_m_penalties: number | null
          fixture_id: string
          frees_against: number | null
          frees_for: number | null
          handballs: number | null
          hitouts: number | null
          id: string
          inside_50s: number | null
          intercept_marks: number | null
          kicks: number | null
          marks: number | null
          rebound_50s: number | null
          spoils: number | null
          tackles: number | null
          team_id: string
          uncontested_possessions: number | null
          updated_at: string
        }
        Insert: {
          clearances?: number | null
          contested_marks?: number | null
          contested_possessions?: number | null
          created_at?: string
          disposals?: number | null
          fifty_m_penalties?: number | null
          fixture_id: string
          frees_against?: number | null
          frees_for?: number | null
          handballs?: number | null
          hitouts?: number | null
          id?: string
          inside_50s?: number | null
          intercept_marks?: number | null
          kicks?: number | null
          marks?: number | null
          rebound_50s?: number | null
          spoils?: number | null
          tackles?: number | null
          team_id: string
          uncontested_possessions?: number | null
          updated_at?: string
        }
        Update: {
          clearances?: number | null
          contested_marks?: number | null
          contested_possessions?: number | null
          created_at?: string
          disposals?: number | null
          fifty_m_penalties?: number | null
          fixture_id?: string
          frees_against?: number | null
          frees_for?: number | null
          handballs?: number | null
          hitouts?: number | null
          id?: string
          inside_50s?: number | null
          intercept_marks?: number | null
          kicks?: number | null
          marks?: number | null
          rebound_50s?: number | null
          spoils?: number | null
          tackles?: number | null
          team_id?: string
          uncontested_possessions?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_team_stats_fixture_id_fkey"
            columns: ["fixture_id"]
            isOneToOne: false
            referencedRelation: "fixtures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_team_stats_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      news: {
        Row: {
          author_id: string
          content: string
          created_at: string
          excerpt: string | null
          id: string
          is_published: boolean
          published_at: string | null
          title: string
          updated_at: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          excerpt?: string | null
          id?: string
          is_published?: boolean
          published_at?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          excerpt?: string | null
          id?: string
          is_published?: boolean
          published_at?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          message: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      players: {
        Row: {
          created_at: string
          first_name: string
          id: string
          is_active: boolean | null
          jersey_number: number | null
          last_name: string
          photo_url: string | null
          position: string | null
          team_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          first_name: string
          id?: string
          is_active?: boolean | null
          jersey_number?: number | null
          last_name: string
          photo_url?: string | null
          position?: string | null
          team_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          first_name?: string
          id?: string
          is_active?: boolean | null
          jersey_number?: number | null
          last_name?: string
          photo_url?: string | null
          position?: string | null
          team_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "players_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          banned_at: string | null
          banned_reason: string | null
          birth_year: number | null
          created_at: string
          facebook_name: string | null
          first_name: string | null
          full_name: string | null
          gamertag: string | null
          id: string
          is_banned: boolean
          last_name: string | null
          role: string | null
          team_id: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          banned_at?: string | null
          banned_reason?: string | null
          birth_year?: number | null
          created_at?: string
          facebook_name?: string | null
          first_name?: string | null
          full_name?: string | null
          gamertag?: string | null
          id: string
          is_banned?: boolean
          last_name?: string | null
          role?: string | null
          team_id?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          banned_at?: string | null
          banned_reason?: string | null
          birth_year?: number | null
          created_at?: string
          facebook_name?: string | null
          first_name?: string | null
          full_name?: string | null
          gamertag?: string | null
          id?: string
          is_banned?: boolean
          last_name?: string | null
          role?: string | null
          team_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      results: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          away_behinds: number | null
          away_goals: number | null
          away_q1: string | null
          away_q2: string | null
          away_q3: string | null
          away_q4: string | null
          away_score: number | null
          best_players_away: string[] | null
          best_players_home: string[] | null
          created_at: string
          fixture_id: string
          goal_kickers_away: string[] | null
          goal_kickers_home: string[] | null
          home_behinds: number | null
          home_goals: number | null
          home_q1: string | null
          home_q2: string | null
          home_q3: string | null
          home_q4: string | null
          home_score: number | null
          id: string
          match_notes: string | null
          status: Database["public"]["Enums"]["result_status"] | null
          submitted_at: string | null
          submitted_by: string | null
          team_id: string | null
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          away_behinds?: number | null
          away_goals?: number | null
          away_q1?: string | null
          away_q2?: string | null
          away_q3?: string | null
          away_q4?: string | null
          away_score?: number | null
          best_players_away?: string[] | null
          best_players_home?: string[] | null
          created_at?: string
          fixture_id: string
          goal_kickers_away?: string[] | null
          goal_kickers_home?: string[] | null
          home_behinds?: number | null
          home_goals?: number | null
          home_q1?: string | null
          home_q2?: string | null
          home_q3?: string | null
          home_q4?: string | null
          home_score?: number | null
          id?: string
          match_notes?: string | null
          status?: Database["public"]["Enums"]["result_status"] | null
          submitted_at?: string | null
          submitted_by?: string | null
          team_id?: string | null
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          away_behinds?: number | null
          away_goals?: number | null
          away_q1?: string | null
          away_q2?: string | null
          away_q3?: string | null
          away_q4?: string | null
          away_score?: number | null
          best_players_away?: string[] | null
          best_players_home?: string[] | null
          created_at?: string
          fixture_id?: string
          goal_kickers_away?: string[] | null
          goal_kickers_home?: string[] | null
          home_behinds?: number | null
          home_goals?: number | null
          home_q1?: string | null
          home_q2?: string | null
          home_q3?: string | null
          home_q4?: string | null
          home_score?: number | null
          id?: string
          match_notes?: string | null
          status?: Database["public"]["Enums"]["result_status"] | null
          submitted_at?: string | null
          submitted_by?: string | null
          team_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "results_fixture_id_fkey"
            columns: ["fixture_id"]
            isOneToOne: true
            referencedRelation: "fixtures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "results_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      rugby_match_results: {
        Row: {
          conversions: number | null
          created_at: string
          field_goals: number | null
          fixture_id: string
          half_time_points: number | null
          id: string
          penalty_goals: number | null
          team_id: string
          total_points: number | null
          tries: number | null
          updated_at: string
        }
        Insert: {
          conversions?: number | null
          created_at?: string
          field_goals?: number | null
          fixture_id: string
          half_time_points?: number | null
          id?: string
          penalty_goals?: number | null
          team_id: string
          total_points?: number | null
          tries?: number | null
          updated_at?: string
        }
        Update: {
          conversions?: number | null
          created_at?: string
          field_goals?: number | null
          fixture_id?: string
          half_time_points?: number | null
          id?: string
          penalty_goals?: number | null
          team_id?: string
          total_points?: number | null
          tries?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      rugby_player_stats: {
        Row: {
          conversions: number | null
          created_at: string
          errors: number | null
          field_goals: number | null
          fixture_id: string
          id: string
          kick_metres: number | null
          line_breaks: number | null
          minutes_played: number | null
          missed_tackles: number | null
          offloads: number | null
          penalties_conceded: number | null
          penalty_goals: number | null
          player_id: string
          position: string | null
          run_metres: number | null
          runs: number | null
          send_offs: number | null
          sin_bins: number | null
          tackle_busts: number | null
          tackles: number | null
          team_id: string
          tries: number | null
          try_assists: number | null
          updated_at: string
        }
        Insert: {
          conversions?: number | null
          created_at?: string
          errors?: number | null
          field_goals?: number | null
          fixture_id: string
          id?: string
          kick_metres?: number | null
          line_breaks?: number | null
          minutes_played?: number | null
          missed_tackles?: number | null
          offloads?: number | null
          penalties_conceded?: number | null
          penalty_goals?: number | null
          player_id: string
          position?: string | null
          run_metres?: number | null
          runs?: number | null
          send_offs?: number | null
          sin_bins?: number | null
          tackle_busts?: number | null
          tackles?: number | null
          team_id: string
          tries?: number | null
          try_assists?: number | null
          updated_at?: string
        }
        Update: {
          conversions?: number | null
          created_at?: string
          errors?: number | null
          field_goals?: number | null
          fixture_id?: string
          id?: string
          kick_metres?: number | null
          line_breaks?: number | null
          minutes_played?: number | null
          missed_tackles?: number | null
          offloads?: number | null
          penalties_conceded?: number | null
          penalty_goals?: number | null
          player_id?: string
          position?: string | null
          run_metres?: number | null
          runs?: number | null
          send_offs?: number | null
          sin_bins?: number | null
          tackle_busts?: number | null
          tackles?: number | null
          team_id?: string
          tries?: number | null
          try_assists?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      rugby_team_stats: {
        Row: {
          created_at: string
          errors: number | null
          fixture_id: string
          id: string
          line_breaks: number | null
          missed_tackles: number | null
          penalties_conceded: number | null
          possession_pct: number | null
          run_metres: number | null
          sets_completed: number | null
          sets_total: number | null
          tackles: number | null
          team_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          errors?: number | null
          fixture_id: string
          id?: string
          line_breaks?: number | null
          missed_tackles?: number | null
          penalties_conceded?: number | null
          possession_pct?: number | null
          run_metres?: number | null
          sets_completed?: number | null
          sets_total?: number | null
          tackles?: number | null
          team_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          errors?: number | null
          fixture_id?: string
          id?: string
          line_breaks?: number | null
          missed_tackles?: number | null
          penalties_conceded?: number | null
          possession_pct?: number | null
          run_metres?: number | null
          sets_completed?: number | null
          sets_total?: number | null
          tackles?: number | null
          team_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      seasons: {
        Row: {
          competition_id: string
          created_at: string
          end_date: string | null
          id: string
          is_current: boolean | null
          name: string
          start_date: string | null
          updated_at: string
          year: number
        }
        Insert: {
          competition_id: string
          created_at?: string
          end_date?: string | null
          id?: string
          is_current?: boolean | null
          name: string
          start_date?: string | null
          updated_at?: string
          year: number
        }
        Update: {
          competition_id?: string
          created_at?: string
          end_date?: string | null
          id?: string
          is_current?: boolean | null
          name?: string
          start_date?: string | null
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "seasons_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
        ]
      }
      sports: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      teams: {
        Row: {
          age_group: string | null
          club_id: string
          competition_id: string
          created_at: string
          division: string | null
          id: string
          season_id: string
          updated_at: string
        }
        Insert: {
          age_group?: string | null
          club_id: string
          competition_id: string
          created_at?: string
          division?: string | null
          id?: string
          season_id: string
          updated_at?: string
        }
        Update: {
          age_group?: string | null
          club_id?: string
          competition_id?: string
          created_at?: string
          division?: string | null
          id?: string
          season_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teams_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teams_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teams_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_score_fixture: {
        Args: { _fixture_id: string; _user_id: string }
        Returns: boolean
      }
      finalise_live_match: {
        Args: { p_fixture_id: string }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      recalculate_position_changes: {
        Args: { p_season_id: string }
        Returns: undefined
      }
      update_ladder_from_cricket_result: {
        Args: { p_fixture_id: string }
        Returns: undefined
      }
      update_ladder_from_result: {
        Args: {
          p_away_behinds: number
          p_away_goals: number
          p_fixture_id: string
          p_home_behinds: number
          p_home_goals: number
        }
        Returns: undefined
      }
      update_ladder_from_rugby_result: {
        Args: { p_fixture_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "league_admin" | "club_admin" | "coach" | "public" | "scorer"
      fixture_status:
        | "scheduled"
        | "in_progress"
        | "completed"
        | "postponed"
        | "cancelled"
      result_status: "draft" | "submitted" | "approved" | "rejected"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["league_admin", "club_admin", "coach", "public", "scorer"],
      fixture_status: [
        "scheduled",
        "in_progress",
        "completed",
        "postponed",
        "cancelled",
      ],
      result_status: ["draft", "submitted", "approved", "rejected"],
    },
  },
} as const
