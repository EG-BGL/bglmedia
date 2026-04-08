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
          created_at: string
          description: string | null
          founded_year: number | null
          home_ground: string | null
          id: string
          logo_url: string | null
          name: string
          primary_color: string | null
          secondary_color: string | null
          short_name: string
          updated_at: string
        }
        Insert: {
          coach?: string | null
          created_at?: string
          description?: string | null
          founded_year?: number | null
          home_ground?: string | null
          id?: string
          logo_url?: string | null
          name: string
          primary_color?: string | null
          secondary_color?: string | null
          short_name: string
          updated_at?: string
        }
        Update: {
          coach?: string | null
          created_at?: string
          description?: string | null
          founded_year?: number | null
          home_ground?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          primary_color?: string | null
          secondary_color?: string | null
          short_name?: string
          updated_at?: string
        }
        Relationships: []
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
          updated_at: string
        }
        Insert: {
          competition_type?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          short_name?: string | null
          updated_at?: string
        }
        Update: {
          competition_type?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          short_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      fixtures: {
        Row: {
          away_team_id: string
          created_at: string
          home_team_id: string
          id: string
          is_locked: boolean | null
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
      players: {
        Row: {
          created_at: string
          first_name: string
          id: string
          is_active: boolean | null
          jersey_number: number | null
          last_name: string
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
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "results_fixture_id_fkey"
            columns: ["fixture_id"]
            isOneToOne: false
            referencedRelation: "fixtures"
            referencedColumns: ["id"]
          },
        ]
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "league_admin" | "club_admin" | "coach" | "public"
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
      app_role: ["league_admin", "club_admin", "coach", "public"],
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
