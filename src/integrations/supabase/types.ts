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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      coin_transactions: {
        Row: {
          action: string
          admin_username: string
          amount: number
          created_at: string
          id: string
          target_username: string
        }
        Insert: {
          action: string
          admin_username: string
          amount: number
          created_at?: string
          id?: string
          target_username: string
        }
        Update: {
          action?: string
          admin_username?: string
          amount?: number
          created_at?: string
          id?: string
          target_username?: string
        }
        Relationships: []
      }
      duels: {
        Row: {
          arena: string | null
          created_at: string
          duration_seconds: number | null
          id: string
          player1_id: string
          player1_kills: number
          player2_id: string
          player2_kills: number
          winner_id: string | null
        }
        Insert: {
          arena?: string | null
          created_at?: string
          duration_seconds?: number | null
          id?: string
          player1_id: string
          player1_kills?: number
          player2_id: string
          player2_kills?: number
          winner_id?: string | null
        }
        Update: {
          arena?: string | null
          created_at?: string
          duration_seconds?: number | null
          id?: string
          player1_id?: string
          player1_kills?: number
          player2_id?: string
          player2_kills?: number
          winner_id?: string | null
        }
        Relationships: []
      }
      player_stats: {
        Row: {
          best_win_streak: number
          created_at: string
          deaths: number
          email: string | null
          id: string
          kills: number
          losses: number
          minecraft_username: string
          total_duels: number
          updated_at: string
          win_streak: number
          wins: number
        }
        Insert: {
          best_win_streak?: number
          created_at?: string
          deaths?: number
          email?: string | null
          id?: string
          kills?: number
          losses?: number
          minecraft_username: string
          total_duels?: number
          updated_at?: string
          win_streak?: number
          wins?: number
        }
        Update: {
          best_win_streak?: number
          created_at?: string
          deaths?: number
          email?: string | null
          id?: string
          kills?: number
          losses?: number
          minecraft_username?: string
          total_duels?: number
          updated_at?: string
          win_streak?: number
          wins?: number
        }
        Relationships: []
      }
      players: {
        Row: {
          coins: number
          created_at: string
          id: number
          is_op: boolean
          username: string
        }
        Insert: {
          coins?: number
          created_at?: string
          id?: number
          is_op?: boolean
          username: string
        }
        Update: {
          coins?: number
          created_at?: string
          id?: number
          is_op?: boolean
          username?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          banned: boolean
          best_win_streak: number
          created_at: string
          id: string
          minecraft_username: string | null
          total_deaths: number
          total_duels: number
          total_kills: number
          total_wins: number
          updated_at: string
          user_id: string
          username: string | null
          win_streak: number
        }
        Insert: {
          avatar_url?: string | null
          banned?: boolean
          best_win_streak?: number
          created_at?: string
          id?: string
          minecraft_username?: string | null
          total_deaths?: number
          total_duels?: number
          total_kills?: number
          total_wins?: number
          updated_at?: string
          user_id: string
          username?: string | null
          win_streak?: number
        }
        Update: {
          avatar_url?: string | null
          banned?: boolean
          best_win_streak?: number
          created_at?: string
          id?: string
          minecraft_username?: string | null
          total_deaths?: number
          total_duels?: number
          total_kills?: number
          total_wins?: number
          updated_at?: string
          user_id?: string
          username?: string | null
          win_streak?: number
        }
        Relationships: []
      }
      verification_codes: {
        Row: {
          code: string
          created_at: string
          expires_at: string
          id: string
          minecraft_username: string
          used: boolean
        }
        Insert: {
          code: string
          created_at?: string
          expires_at: string
          id?: string
          minecraft_username: string
          used?: boolean
        }
        Update: {
          code?: string
          created_at?: string
          expires_at?: string
          id?: string
          minecraft_username?: string
          used?: boolean
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
    Enums: {},
  },
} as const
