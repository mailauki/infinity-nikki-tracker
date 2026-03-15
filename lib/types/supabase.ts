export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.1'
  }
  public: {
    Tables: {
      categories: {
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
      colors: {
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
            foreignKeyName: 'eureka_set_trials_eureka_set_fkey'
            columns: ['eureka_set']
            isOneToOne: false
            referencedRelation: 'eureka_sets'
            referencedColumns: ['slug']
          },
          {
            foreignKeyName: 'eureka_set_trials_trial_fkey'
            columns: ['trial']
            isOneToOne: false
            referencedRelation: 'trials'
            referencedColumns: ['slug']
          },
        ]
      }
      eureka_sets: {
        Row: {
          created_at: string
          id: number
          label: string | null
          rarity: number | null
          slug: string
          style: string | null
          title: string
          trial: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          label?: string | null
          rarity?: number | null
          slug: string
          style?: string | null
          title?: string
          trial?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          label?: string | null
          rarity?: number | null
          slug?: string
          style?: string | null
          title?: string
          trial?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'eureka_sets_label_fkey'
            columns: ['label']
            isOneToOne: false
            referencedRelation: 'labels'
            referencedColumns: ['slug']
          },
          {
            foreignKeyName: 'eureka_sets_style_fkey'
            columns: ['style']
            isOneToOne: false
            referencedRelation: 'styles'
            referencedColumns: ['slug']
          },
          {
            foreignKeyName: 'eureka_sets_trial_fkey'
            columns: ['trial']
            isOneToOne: false
            referencedRelation: 'trials'
            referencedColumns: ['slug']
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
            foreignKeyName: 'eureka_variants_category_fkey'
            columns: ['category']
            isOneToOne: false
            referencedRelation: 'categories'
            referencedColumns: ['slug']
          },
          {
            foreignKeyName: 'eureka_variants_color_fkey'
            columns: ['color']
            isOneToOne: false
            referencedRelation: 'colors'
            referencedColumns: ['slug']
          },
          {
            foreignKeyName: 'eureka_variants_eureka_set_fkey'
            columns: ['eureka_set']
            isOneToOne: false
            referencedRelation: 'eureka_sets'
            referencedColumns: ['slug']
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
            foreignKeyName: 'obtained_eureka_category_fkey'
            columns: ['category']
            isOneToOne: false
            referencedRelation: 'categories'
            referencedColumns: ['slug']
          },
          {
            foreignKeyName: 'obtained_eureka_color_fkey'
            columns: ['color']
            isOneToOne: false
            referencedRelation: 'colors'
            referencedColumns: ['slug']
          },
          {
            foreignKeyName: 'obtained_eureka_eureka_set_fkey'
            columns: ['eureka_set']
            isOneToOne: false
            referencedRelation: 'eureka_sets'
            referencedColumns: ['slug']
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          role: string
          updated_at: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          role?: string
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          role?: string
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
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
          id: number
          image_url: string | null
          slug: string
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          image_url?: string | null
          slug: string
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          image_url?: string | null
          slug?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
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
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
