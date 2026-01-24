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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string
          id: number
          image_url: string | null
          name: string
        }
        Insert: {
          created_at?: string
          id?: number
          image_url?: string | null
          name: string
        }
        Update: {
          created_at?: string
          id?: number
          image_url?: string | null
          name?: string
        }
        Relationships: []
      }
      colors: {
        Row: {
          created_at: string
          image_url: string | null
          name: string
        }
        Insert: {
          created_at?: string
          image_url?: string | null
          name?: string
        }
        Update: {
          created_at?: string
          image_url?: string | null
          name?: string
        }
        Relationships: []
      }
      eureka: {
        Row: {
          created_at: string
          id: number
          labels: string | null
          name: string
          quality: number | null
          style: string | null
          trial: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          labels?: string | null
          name?: string
          quality?: number | null
          style?: string | null
          trial?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          labels?: string | null
          name?: string
          quality?: number | null
          style?: string | null
          trial?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "Eureka_trial_fkey"
            columns: ["trial"]
            isOneToOne: false
            referencedRelation: "trials"
            referencedColumns: ["name"]
          },
        ]
      }
      eureka_colors: {
        Row: {
          color: string
          created_at: string
          eureka: string
        }
        Insert: {
          color: string
          created_at?: string
          eureka: string
        }
        Update: {
          color?: string
          created_at?: string
          eureka?: string
        }
        Relationships: [
          {
            foreignKeyName: "eureka_colors_color_fkey"
            columns: ["color"]
            isOneToOne: false
            referencedRelation: "colors"
            referencedColumns: ["name"]
          },
          {
            foreignKeyName: "eureka_colors_eureka_fkey"
            columns: ["eureka"]
            isOneToOne: false
            referencedRelation: "eureka"
            referencedColumns: ["name"]
          },
        ]
      }
      images: {
        Row: {
          category: string | null
          color: string | null
          created_at: string
          default: boolean
          eureka: string | null
          id: number
          image_url: string | null
        }
        Insert: {
          category?: string | null
          color?: string | null
          created_at?: string
          default?: boolean
          eureka?: string | null
          id?: number
          image_url?: string | null
        }
        Update: {
          category?: string | null
          color?: string | null
          created_at?: string
          default?: boolean
          eureka?: string | null
          id?: number
          image_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "images_category_fkey"
            columns: ["category"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["name"]
          },
          {
            foreignKeyName: "images_color_fkey"
            columns: ["color"]
            isOneToOne: false
            referencedRelation: "colors"
            referencedColumns: ["name"]
          },
          {
            foreignKeyName: "images_eureka_fkey"
            columns: ["eureka"]
            isOneToOne: false
            referencedRelation: "eureka"
            referencedColumns: ["name"]
          },
        ]
      }
      obtained: {
        Row: {
          category: string | null
          color: string | null
          created_at: string
          eureka: string | null
          id: number
          user_id: string | null
        }
        Insert: {
          category?: string | null
          color?: string | null
          created_at?: string
          eureka?: string | null
          id?: number
          user_id?: string | null
        }
        Update: {
          category?: string | null
          color?: string | null
          created_at?: string
          eureka?: string | null
          id?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "obtained_category_fkey"
            columns: ["category"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["name"]
          },
          {
            foreignKeyName: "obtained_color_fkey"
            columns: ["color"]
            isOneToOne: false
            referencedRelation: "colors"
            referencedColumns: ["name"]
          },
          {
            foreignKeyName: "obtained_eureka_fkey"
            columns: ["eureka"]
            isOneToOne: false
            referencedRelation: "eureka"
            referencedColumns: ["name"]
          },
        ]
      }
      trials: {
        Row: {
          created_at: string
          id: number
          name: string
          image_url: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          name: string
          image_url?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          name?: string
          image_url?: string | null
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
