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
      abilities: {
        Row: {
          id: number
          image_url: string | null
          slug: string
          title: string
        }
        Insert: {
          id?: number
          image_url?: string | null
          slug: string
          title: string
        }
        Update: {
          id?: number
          image_url?: string | null
          slug?: string
          title?: string
        }
        Relationships: []
      }
      admin_preferences: {
        Row: {
          admin_view: string
          user_id: string
        }
        Insert: {
          admin_view?: string
          user_id: string
        }
        Update: {
          admin_view?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_looks: {
        Row: {
          created_at: string
          description: string | null
          eureka_variant_slugs: string[]
          id: string
          name: string
          outfit_variant_slugs: string[]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          eureka_variant_slugs?: string[]
          id?: string
          name: string
          outfit_variant_slugs?: string[]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          eureka_variant_slugs?: string[]
          id?: string
          name?: string
          outfit_variant_slugs?: string[]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_looks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      eureka_categories: {
        Row: {
          created_at: string
          id: number
          image_url: string | null
          slug: string
          title: string
        }
        Insert: {
          created_at?: string
          id?: number
          image_url?: string | null
          slug: string
          title: string
        }
        Update: {
          created_at?: string
          id?: number
          image_url?: string | null
          slug?: string
          title?: string
        }
        Relationships: []
      }
      eureka_colors: {
        Row: {
          created_at: string
          id: number
          image_url: string | null
          slug: string
          title: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          image_url?: string | null
          slug: string
          title?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          image_url?: string | null
          slug?: string
          title?: string | null
        }
        Relationships: []
      }
      eureka_set_trials: {
        Row: {
          eureka_set: string
          trial: string
        }
        Insert: {
          eureka_set: string
          trial: string
        }
        Update: {
          eureka_set?: string
          trial?: string
        }
        Relationships: [
          {
            foreignKeyName: "eureka_set_trials_eureka_set_fkey"
            columns: ["eureka_set"]
            isOneToOne: false
            referencedRelation: "eureka_sets"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "eureka_set_trials_trial_fkey"
            columns: ["trial"]
            isOneToOne: false
            referencedRelation: "trials"
            referencedColumns: ["slug"]
          },
        ]
      }
      eureka_sets: {
        Row: {
          created_at: string
          description: string | null
          id: number
          label: string | null
          rarity: number | null
          slug: string
          style: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: number
          label?: string | null
          rarity?: number | null
          slug: string
          style?: string | null
          title?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: number
          label?: string | null
          rarity?: number | null
          slug?: string
          style?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "eureka_sets_label_fkey"
            columns: ["label"]
            isOneToOne: false
            referencedRelation: "labels"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "eureka_sets_style_fkey"
            columns: ["style"]
            isOneToOne: false
            referencedRelation: "styles"
            referencedColumns: ["slug"]
          },
        ]
      }
      eureka_variants: {
        Row: {
          category: string | null
          color: string | null
          created_at: string
          default: boolean
          eureka_set: string | null
          id: number
          image_url: string | null
          slug: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          color?: string | null
          created_at?: string
          default?: boolean
          eureka_set?: string | null
          id?: number
          image_url?: string | null
          slug: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          color?: string | null
          created_at?: string
          default?: boolean
          eureka_set?: string | null
          id?: number
          image_url?: string | null
          slug?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "eureka_variants_category_fkey"
            columns: ["category"]
            isOneToOne: false
            referencedRelation: "eureka_categories"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "eureka_variants_color_fkey"
            columns: ["color"]
            isOneToOne: false
            referencedRelation: "eureka_colors"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "eureka_variants_eureka_set_fkey"
            columns: ["eureka_set"]
            isOneToOne: false
            referencedRelation: "eureka_sets"
            referencedColumns: ["slug"]
          },
        ]
      }
      evolution_carousel_images: {
        Row: {
          created_at: string | null
          evolution: string
          id: number
          image_url: string
          sort_order: number
        }
        Insert: {
          created_at?: string | null
          evolution: string
          id?: number
          image_url: string
          sort_order?: number
        }
        Update: {
          created_at?: string | null
          evolution?: string
          id?: number
          image_url?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "evolution_carousel_images_evolution_fkey"
            columns: ["evolution"]
            isOneToOne: false
            referencedRelation: "evolutions"
            referencedColumns: ["slug"]
          },
        ]
      }
      evolutions: {
        Row: {
          alt_image_url: string | null
          created_at: string
          description: string | null
          id: number
          image_url: string | null
          order: number
          outfit_set: string
          slug: string
          subtitle: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          alt_image_url?: string | null
          created_at?: string
          description?: string | null
          id?: number
          image_url?: string | null
          order: number
          outfit_set: string
          slug: string
          subtitle?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          alt_image_url?: string | null
          created_at?: string
          description?: string | null
          id?: number
          image_url?: string | null
          order?: number
          outfit_set?: string
          slug?: string
          subtitle?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "evolutions_outfit_set_fkey"
            columns: ["outfit_set"]
            isOneToOne: false
            referencedRelation: "outfit_sets"
            referencedColumns: ["slug"]
          },
        ]
      }
      labels: {
        Row: {
          created_at: string
          id: number
          slug: string
          title: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          slug: string
          title?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          slug?: string
          title?: string | null
        }
        Relationships: []
      }
      locations: {
        Row: {
          created_at: string
          id: number
          slug: string
          title: string
        }
        Insert: {
          created_at?: string
          id?: number
          slug: string
          title: string
        }
        Update: {
          created_at?: string
          id?: number
          slug?: string
          title?: string
        }
        Relationships: []
      }
      obtained_eureka: {
        Row: {
          category: string | null
          color: string | null
          created_at: string
          eureka_set: string | null
          id: number
          user_id: string | null
        }
        Insert: {
          category?: string | null
          color?: string | null
          created_at?: string
          eureka_set?: string | null
          id?: number
          user_id?: string | null
        }
        Update: {
          category?: string | null
          color?: string | null
          created_at?: string
          eureka_set?: string | null
          id?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "obtained_eureka_category_fkey"
            columns: ["category"]
            isOneToOne: false
            referencedRelation: "eureka_categories"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "obtained_eureka_color_fkey"
            columns: ["color"]
            isOneToOne: false
            referencedRelation: "eureka_colors"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "obtained_eureka_eureka_set_fkey"
            columns: ["eureka_set"]
            isOneToOne: false
            referencedRelation: "eureka_sets"
            referencedColumns: ["slug"]
          },
        ]
      }
      obtained_outfit: {
        Row: {
          created_at: string
          evolution: string | null
          id: number
          outfit_category: string
          outfit_set: string
          user_id: string
        }
        Insert: {
          created_at?: string
          evolution?: string | null
          id?: number
          outfit_category: string
          outfit_set: string
          user_id: string
        }
        Update: {
          created_at?: string
          evolution?: string | null
          id?: number
          outfit_category?: string
          outfit_set?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "obtained_outfit_category_fkey"
            columns: ["outfit_category"]
            isOneToOne: false
            referencedRelation: "outfit_categories"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "obtained_outfit_evolution_fkey"
            columns: ["evolution"]
            isOneToOne: false
            referencedRelation: "evolutions"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "obtained_outfit_set_fkey"
            columns: ["outfit_set"]
            isOneToOne: false
            referencedRelation: "outfit_sets"
            referencedColumns: ["slug"]
          },
        ]
      }
      outfit_categories: {
        Row: {
          created_at: string | null
          id: number
          image_url: string | null
          part: string
          slug: string
          title: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          image_url?: string | null
          part?: string
          slug: string
          title: string
        }
        Update: {
          created_at?: string | null
          id?: number
          image_url?: string | null
          part?: string
          slug?: string
          title?: string
        }
        Relationships: []
      }
      outfit_set_carousel_images: {
        Row: {
          created_at: string | null
          id: number
          image_url: string
          outfit_set: string
          sort_order: number
        }
        Insert: {
          created_at?: string | null
          id?: number
          image_url: string
          outfit_set: string
          sort_order?: number
        }
        Update: {
          created_at?: string | null
          id?: number
          image_url?: string
          outfit_set?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "outfit_set_carousel_images_outfit_set_fkey"
            columns: ["outfit_set"]
            isOneToOne: false
            referencedRelation: "outfit_sets"
            referencedColumns: ["slug"]
          },
        ]
      }
      outfit_sets: {
        Row: {
          ability: string | null
          alt_image_url: string | null
          created_at: string | null
          description: string | null
          glowup_evolution: string | null
          id: number
          image_url: string | null
          label: string | null
          label_2: string | null
          rarity: number
          season_category: string | null
          seasons: string | null
          slug: string
          style: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          ability?: string | null
          alt_image_url?: string | null
          created_at?: string | null
          description?: string | null
          glowup_evolution?: string | null
          id?: number
          image_url?: string | null
          label?: string | null
          label_2?: string | null
          rarity: number
          season_category?: string | null
          seasons?: string | null
          slug: string
          style?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          ability?: string | null
          alt_image_url?: string | null
          created_at?: string | null
          description?: string | null
          glowup_evolution?: string | null
          id?: number
          image_url?: string | null
          label?: string | null
          label_2?: string | null
          rarity?: number
          season_category?: string | null
          seasons?: string | null
          slug?: string
          style?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "outfit_sets_ability_fkey"
            columns: ["ability"]
            isOneToOne: false
            referencedRelation: "abilities"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "outfit_sets_glowup_evolution_fkey"
            columns: ["glowup_evolution"]
            isOneToOne: false
            referencedRelation: "evolutions"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "outfit_sets_label_2_fkey"
            columns: ["label_2"]
            isOneToOne: false
            referencedRelation: "labels"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "outfit_sets_label_fkey"
            columns: ["label"]
            isOneToOne: false
            referencedRelation: "labels"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "outfit_sets_season_category_fkey"
            columns: ["season_category"]
            isOneToOne: false
            referencedRelation: "season_categories"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "outfit_sets_seasons_fkey"
            columns: ["seasons"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "outfit_sets_style_fkey"
            columns: ["style"]
            isOneToOne: false
            referencedRelation: "styles"
            referencedColumns: ["slug"]
          },
        ]
      }
      outfit_variants: {
        Row: {
          alt_image_url: string | null
          created_at: string | null
          default: boolean
          description: string | null
          evolution: string | null
          id: number
          image_url: string | null
          outfit_category: string | null
          outfit_set: string
          slug: string
          title: string | null
          updated_at: string | null
        }
        Insert: {
          alt_image_url?: string | null
          created_at?: string | null
          default?: boolean
          description?: string | null
          evolution?: string | null
          id?: number
          image_url?: string | null
          outfit_category?: string | null
          outfit_set: string
          slug: string
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          alt_image_url?: string | null
          created_at?: string | null
          default?: boolean
          description?: string | null
          evolution?: string | null
          id?: number
          image_url?: string | null
          outfit_category?: string | null
          outfit_set?: string
          slug?: string
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "outfit_variants_evolution_fkey"
            columns: ["evolution"]
            isOneToOne: false
            referencedRelation: "evolutions"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "outfit_variants_outfit_category_fkey"
            columns: ["outfit_category"]
            isOneToOne: false
            referencedRelation: "outfit_categories"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "outfit_variants_outfit_set_fkey"
            columns: ["outfit_set"]
            isOneToOne: false
            referencedRelation: "outfit_sets"
            referencedColumns: ["slug"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          is_premium: boolean
          premium_purchased_at: string | null
          role: string
          updated_at: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          is_premium?: boolean
          premium_purchased_at?: string | null
          role?: string
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          is_premium?: boolean
          premium_purchased_at?: string | null
          role?: string
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      season_categories: {
        Row: {
          created_at: string
          description: string | null
          id: number
          image_url: string | null
          slug: string
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: number
          image_url?: string | null
          slug: string
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: number
          image_url?: string | null
          slug?: string
          title?: string
        }
        Relationships: []
      }
      seasons: {
        Row: {
          alt_image_url: string | null
          created_at: string
          description: string | null
          id: number
          image_url: string | null
          location: string | null
          slug: string
          title: string
        }
        Insert: {
          alt_image_url?: string | null
          created_at?: string
          description?: string | null
          id?: number
          image_url?: string | null
          location?: string | null
          slug: string
          title: string
        }
        Update: {
          alt_image_url?: string | null
          created_at?: string
          description?: string | null
          id?: number
          image_url?: string | null
          location?: string | null
          slug?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "seasons_location_fkey"
            columns: ["location"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["slug"]
          },
        ]
      }
      styles: {
        Row: {
          created_at: string
          id: number
          slug: string
          title: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          slug: string
          title?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          slug?: string
          title?: string | null
        }
        Relationships: []
      }
      trials: {
        Row: {
          created_at: string
          description: string | null
          id: number
          image_url: string | null
          location: string | null
          realm: string | null
          slug: string
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: number
          image_url?: string | null
          location?: string | null
          realm?: string | null
          slug: string
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: number
          image_url?: string | null
          location?: string | null
          realm?: string | null
          slug?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trials_location_fkey"
            columns: ["location"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["slug"]
          },
        ]
      }
      user_preferences: {
        Row: {
          color_theme: string
          created_at: string
          eureka_category: string | null
          eureka_color: string | null
          eureka_obtained_filter: string | null
          eureka_rarity: string | null
          eureka_set_filter: string | null
          group_by_set: boolean
          outfit_category_filter: string | null
          outfit_density: string | null
          outfit_evolution_filter: string | null
          outfit_group_by_set: boolean
          outfit_hide_evolutions: boolean
          outfit_hide_glowups: boolean
          outfit_image_mode: string | null
          outfit_obtained_filter: string | null
          outfit_rarity_filter: string | null
          outfit_set_filter: string | null
          outfit_sort_axis: string | null
          show_by_color: boolean
          sort_order: string | null
          theme: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          color_theme?: string
          created_at?: string
          eureka_category?: string | null
          eureka_color?: string | null
          eureka_obtained_filter?: string | null
          eureka_rarity?: string | null
          eureka_set_filter?: string | null
          group_by_set?: boolean
          outfit_category_filter?: string | null
          outfit_density?: string | null
          outfit_evolution_filter?: string | null
          outfit_group_by_set?: boolean
          outfit_hide_evolutions?: boolean
          outfit_hide_glowups?: boolean
          outfit_image_mode?: string | null
          outfit_obtained_filter?: string | null
          outfit_rarity_filter?: string | null
          outfit_set_filter?: string | null
          outfit_sort_axis?: string | null
          show_by_color?: boolean
          sort_order?: string | null
          theme?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          color_theme?: string
          created_at?: string
          eureka_category?: string | null
          eureka_color?: string | null
          eureka_obtained_filter?: string | null
          eureka_rarity?: string | null
          eureka_set_filter?: string | null
          group_by_set?: boolean
          outfit_category_filter?: string | null
          outfit_density?: string | null
          outfit_evolution_filter?: string | null
          outfit_group_by_set?: boolean
          outfit_hide_evolutions?: boolean
          outfit_hide_glowups?: boolean
          outfit_image_mode?: string | null
          outfit_obtained_filter?: string | null
          outfit_rarity_filter?: string | null
          outfit_set_filter?: string | null
          outfit_sort_axis?: string | null
          show_by_color?: boolean
          sort_order?: string | null
          theme?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: never; Returns: boolean }
      toggle_obtained: {
        Args: { p_category: string; p_color: string; p_eureka_set: string }
        Returns: undefined
      }
      toggle_obtained_outfit: {
        Args: {
          p_evolution: string
          p_outfit_category: string
          p_outfit_set: string
        }
        Returns: undefined
      }
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
