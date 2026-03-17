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
      food_logs: {
        Row: { id: string; user_id: string; name: string; meal: string; quantity: number; unit: string; calories: number; protein: number; carbs: number; fat: number; fiber: number; logged_date: string; created_at: string }
        Insert: { id?: string; user_id: string; name: string; meal?: string; quantity?: number; unit?: string; calories?: number; protein?: number; carbs?: number; fat?: number; fiber?: number; logged_date?: string; created_at?: string }
        Update: { id?: string; user_id?: string; name?: string; meal?: string; quantity?: number; unit?: string; calories?: number; protein?: number; carbs?: number; fat?: number; fiber?: number; logged_date?: string }
        Relationships: []
      }
      workout_logs: {
        Row: { id: string; user_id: string; name: string; type: string; duration_minutes: number; calories_burned: number; notes: string | null; exercises: any | null; logged_date: string; created_at: string }
        Insert: { id?: string; user_id: string; name: string; type?: string; duration_minutes?: number; calories_burned?: number; notes?: string | null; exercises?: any | null; logged_date?: string; created_at?: string }
        Update: { id?: string; user_id?: string; name?: string; type?: string; duration_minutes?: number; calories_burned?: number; notes?: string | null; exercises?: any | null; logged_date?: string }
        Relationships: []
      }
      goals: {
        Row: { id: string; user_id: string; title: string; categories: string[]; target: number; current_value: number; starting_value: number; unit: string; direction: string; deadline: string | null; created_at: string }
        Insert: { id?: string; user_id: string; title: string; categories?: string[]; target?: number; current_value?: number; starting_value?: number; unit?: string; direction?: string; deadline?: string | null; created_at?: string }
        Update: { id?: string; user_id?: string; title?: string; categories?: string[]; target?: number; current_value?: number; starting_value?: number; unit?: string; direction?: string; deadline?: string | null }
        Relationships: []
      }
      lifestyle_logs: {
        Row: { id: string; user_id: string; logged_date: string; sleep_hours: number; sleep_quality: number; mood: number; stress: number; notes: string | null; created_at: string }
        Insert: { id?: string; user_id: string; logged_date?: string; sleep_hours?: number; sleep_quality?: number; mood?: number; stress?: number; notes?: string | null; created_at?: string }
        Update: { id?: string; user_id?: string; logged_date?: string; sleep_hours?: number; sleep_quality?: number; mood?: number; stress?: number; notes?: string | null }
        Relationships: []
      }
      water_logs: {
        Row: { id: string; user_id: string; amount_ml: number; logged_date: string; logged_at: string }
        Insert: { id?: string; user_id: string; amount_ml?: number; logged_date?: string; logged_at?: string }
        Update: { id?: string; user_id?: string; amount_ml?: number; logged_date?: string; logged_at?: string }
        Relationships: []
      }
      meal_plans: {
        Row: { id: string; user_id: string; week_start: string; plan_data: any; created_at: string; updated_at: string }
        Insert: { id?: string; user_id: string; week_start: string; plan_data?: any; created_at?: string; updated_at?: string }
        Update: { id?: string; user_id?: string; week_start?: string; plan_data?: any; updated_at?: string }
        Relationships: []
      }
      fasting_sessions: {
        Row: { id: string; user_id: string; protocol: string; started_at: string; ended_at: string | null; target_hours: number; completed: boolean; created_at: string }
        Insert: { id?: string; user_id: string; protocol?: string; started_at: string; ended_at?: string | null; target_hours?: number; completed?: boolean; created_at?: string }
        Update: { id?: string; user_id?: string; protocol?: string; started_at?: string; ended_at?: string | null; target_hours?: number; completed?: boolean }
        Relationships: []
      }
      steps_logs: {
        Row: { id: string; user_id: string; steps: number; goal: number; logged_date: string; created_at: string }
        Insert: { id?: string; user_id: string; steps?: number; goal?: number; logged_date?: string; created_at?: string }
        Update: { id?: string; user_id?: string; steps?: number; goal?: number; logged_date?: string }
        Relationships: []
      }
      community_posts: {
        Row: {
          id: string
          user_id: string
          author_name: string
          author_initials: string
          content: string
          tag: string
          likes: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          author_name?: string
          author_initials?: string
          content: string
          tag?: string
          likes?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          author_name?: string
          author_initials?: string
          content?: string
          tag?: string
          likes?: number
          created_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          phone: string | null
          recovery_email: string | null
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          phone?: string | null
          recovery_email?: string | null
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          phone?: string | null
          recovery_email?: string | null
          updated_at?: string
          user_id?: string
          username?: string | null
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
