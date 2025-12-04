// Database types for Supabase tables
// Auto-generated from Supabase schema

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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      league_members: {
        Row: {
          draft_order: number | null
          id: string
          joined_at: string | null
          league_id: string | null
          user_id: string | null
          wallet_address: string
        }
        Insert: {
          draft_order?: number | null
          id?: string
          joined_at?: string | null
          league_id?: string | null
          user_id?: string | null
          wallet_address: string
        }
        Update: {
          draft_order?: number | null
          id?: string
          joined_at?: string | null
          league_id?: string | null
          user_id?: string | null
          wallet_address?: string
        }
        Relationships: [
          {
            foreignKeyName: "league_members_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "league_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      leagues: {
        Row: {
          created_at: string | null
          creator_address: string
          draft_started_at: string | null
          end_time: string
          id: string
          max_players: number | null
          mode: string | null
          name: string
          on_chain_id: number | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          creator_address: string
          draft_started_at?: string | null
          end_time: string
          id?: string
          max_players?: number | null
          mode?: string | null
          name: string
          on_chain_id?: number | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          creator_address?: string
          draft_started_at?: string | null
          end_time?: string
          id?: string
          max_players?: number | null
          mode?: string | null
          name?: string
          on_chain_id?: number | null
          status?: string | null
        }
        Relationships: []
      }
      picks: {
        Row: {
          correct: boolean | null
          id: string
          league_id: string | null
          market_id: string
          outcome_side: string
          pick_number: number
          picked_at: string | null
          resolved: boolean | null
          round: number
          user_id: string | null
          wallet_address: string
        }
        Insert: {
          correct?: boolean | null
          id?: string
          league_id?: string | null
          market_id: string
          outcome_side: string
          pick_number: number
          picked_at?: string | null
          resolved?: boolean | null
          round: number
          user_id?: string | null
          wallet_address: string
        }
        Update: {
          correct?: boolean | null
          id?: string
          league_id?: string | null
          market_id?: string
          outcome_side?: string
          pick_number?: number
          picked_at?: string | null
          resolved?: boolean | null
          round?: number
          user_id?: string | null
          wallet_address?: string
        }
        Relationships: [
          {
            foreignKeyName: "picks_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "picks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      scores: {
        Row: {
          id: string
          is_winner: boolean | null
          league_id: string | null
          points: number | null
          rank: number | null
          updated_at: string | null
          user_id: string | null
          wallet_address: string
        }
        Insert: {
          id?: string
          is_winner?: boolean | null
          league_id?: string | null
          points?: number | null
          rank?: number | null
          updated_at?: string | null
          user_id?: string | null
          wallet_address: string
        }
        Update: {
          id?: string
          is_winner?: boolean | null
          league_id?: string | null
          points?: number | null
          rank?: number | null
          updated_at?: string | null
          user_id?: string | null
          wallet_address?: string
        }
        Relationships: [
          {
            foreignKeyName: "scores_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scores_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string | null
          id: string
          total_leagues: number | null
          total_points: number | null
          username: string | null
          wallet_address: string | null
          wins: number | null
          fid: number | null
          display_name: string | null
          auth_method: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          total_leagues?: number | null
          total_points?: number | null
          username?: string | null
          wallet_address?: string
          wins?: number | null
          fid?: number
          display_name?: string
          auth_method?: string
        }
        Update: {
          created_at?: string | null
          id?: string
          total_leagues?: number | null
          total_points?: number | null
          username?: string | null
          wallet_address?: string
          wins?: number | null
          fid?: number
          display_name?: string
          auth_method?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Helper types for easier access
export type User = Database['public']['Tables']['users']['Row']
export type League = Database['public']['Tables']['leagues']['Row']
export type LeagueMember = Database['public']['Tables']['league_members']['Row']
export type Pick = Database['public']['Tables']['picks']['Row']
export type Score = Database['public']['Tables']['scores']['Row']

// Insert types
export type UserInsert = Database['public']['Tables']['users']['Insert']
export type LeagueInsert = Database['public']['Tables']['leagues']['Insert']
export type LeagueMemberInsert = Database['public']['Tables']['league_members']['Insert']
export type PickInsert = Database['public']['Tables']['picks']['Insert']
export type ScoreInsert = Database['public']['Tables']['scores']['Insert']

// Update types
export type UserUpdate = Database['public']['Tables']['users']['Update']
export type LeagueUpdate = Database['public']['Tables']['leagues']['Update']
export type LeagueMemberUpdate = Database['public']['Tables']['league_members']['Update']
export type PickUpdate = Database['public']['Tables']['picks']['Update']
export type ScoreUpdate = Database['public']['Tables']['scores']['Update']
