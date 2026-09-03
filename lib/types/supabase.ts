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
      abilities: {
        Row: {
          created_at: string | null
          id: number
          image_url: string | null
          slug: string
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          image_url?: string | null
          slug: string
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          image_url?: string | null
          slug?: string
          title?: string
          updated_at?: string | null
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
          image_url: string | null
          name: string
          outfit_variant_slugs: string[]
          slug: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          eureka_variant_slugs?: string[]
          id?: string
          image_url?: string | null
          name: string
          outfit_variant_slugs?: string[]
          slug?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          eureka_variant_slugs?: string[]
          id?: string
          image_url?: string | null
          name?: string
          outfit_variant_slugs?: string[]
          slug?: string | null
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
      feedback: {
        Row: {
          admin_notes: string | null
          category: string
          created_at: string
          description: string
          email: string | null
          entity_slug: string | null
          entity_title: string | null
          entity_type: string | null
          id: string
          page_path: string | null
          receipt_sent_at: string | null
          status: string
          title: string
          type: string
          updated_at: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          admin_notes?: string | null
          category: string
          created_at?: string
          description: string
          email?: string | null
          entity_slug?: string | null
          entity_title?: string | null
          entity_type?: string | null
          id?: string
          page_path?: string | null
          receipt_sent_at?: string | null
          status?: string
          title: string
          type: string
          updated_at?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          admin_notes?: string | null
          category?: string
          created_at?: string
          description?: string
          email?: string | null
          entity_slug?: string | null
          entity_title?: string | null
          entity_type?: string | null
          id?: string
          page_path?: string | null
          receipt_sent_at?: string | null
          status?: string
          title?: string
          type?: string
          updated_at?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      feedback_images: {
        Row: {
          created_at: string
          feedback_id: string
          id: string
          path: string
        }
        Insert: {
          created_at?: string
          feedback_id: string
          id?: string
          path: string
        }
        Update: {
          created_at?: string
          feedback_id?: string
          id?: string
          path?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_images_feedback_id_fkey"
            columns: ["feedback_id"]
            isOneToOne: false
            referencedRelation: "feedback"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback_rate_limit: {
        Row: {
          count: number
          ip_hash: string
          window_start: string
        }
        Insert: {
          count?: number
          ip_hash: string
          window_start: string
        }
        Update: {
          count?: number
          ip_hash?: string
          window_start?: string
        }
        Relationships: []
      }
      follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
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
      makeup_categories: {
        Row: {
          created_at: string | null
          id: number
          image_url: string | null
          slug: string
          title: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          image_url?: string | null
          slug: string
          title: string
        }
        Update: {
          created_at?: string | null
          id?: number
          image_url?: string | null
          slug?: string
          title?: string
        }
        Relationships: []
      }
      makeup_sets: {
        Row: {
          alt_image_url: string | null
          base_set: string | null
          created_at: string | null
          description: string | null
          id: number
          image_url: string | null
          order: number
          outfit_set: string | null
          rarity: number
          season_category: string | null
          seasons: string | null
          slug: string
          style: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          alt_image_url?: string | null
          base_set?: string | null
          created_at?: string | null
          description?: string | null
          id?: number
          image_url?: string | null
          order?: number
          outfit_set?: string | null
          rarity: number
          season_category?: string | null
          seasons?: string | null
          slug: string
          style?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          alt_image_url?: string | null
          base_set?: string | null
          created_at?: string | null
          description?: string | null
          id?: number
          image_url?: string | null
          order?: number
          outfit_set?: string | null
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
            foreignKeyName: "makeup_sets_base_set_fkey"
            columns: ["base_set"]
            isOneToOne: false
            referencedRelation: "makeup_sets"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "makeup_sets_outfit_set_fkey"
            columns: ["outfit_set"]
            isOneToOne: false
            referencedRelation: "outfit_sets"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "makeup_sets_season_category_fkey"
            columns: ["season_category"]
            isOneToOne: false
            referencedRelation: "season_categories"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "makeup_sets_seasons_fkey"
            columns: ["seasons"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "makeup_sets_style_fkey"
            columns: ["style"]
            isOneToOne: false
            referencedRelation: "styles"
            referencedColumns: ["slug"]
          },
        ]
      }
      makeup_variants: {
        Row: {
          alt_image_url: string | null
          alt_slug: string | null
          created_at: string | null
          default: boolean
          description: string | null
          id: number
          image_url: string | null
          makeup_category: string | null
          makeup_set: string | null
          rarity: number | null
          season_category: string | null
          seasons: string | null
          slug: string
          style: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          alt_image_url?: string | null
          alt_slug?: string | null
          created_at?: string | null
          default?: boolean
          description?: string | null
          id?: number
          image_url?: string | null
          makeup_category?: string | null
          makeup_set?: string | null
          rarity?: number | null
          season_category?: string | null
          seasons?: string | null
          slug: string
          style?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          alt_image_url?: string | null
          alt_slug?: string | null
          created_at?: string | null
          default?: boolean
          description?: string | null
          id?: number
          image_url?: string | null
          makeup_category?: string | null
          makeup_set?: string | null
          rarity?: number | null
          season_category?: string | null
          seasons?: string | null
          slug?: string
          style?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "makeup_variants_makeup_category_fkey"
            columns: ["makeup_category"]
            isOneToOne: false
            referencedRelation: "makeup_categories"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "makeup_variants_makeup_set_fkey"
            columns: ["makeup_set"]
            isOneToOne: false
            referencedRelation: "makeup_sets"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "makeup_variants_season_category_fkey"
            columns: ["season_category"]
            isOneToOne: false
            referencedRelation: "season_categories"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "makeup_variants_seasons_fkey"
            columns: ["seasons"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "makeup_variants_style_fkey"
            columns: ["style"]
            isOneToOne: false
            referencedRelation: "styles"
            referencedColumns: ["slug"]
          },
        ]
      }
      momo_cloaks: {
        Row: {
          alt_image_url: string | null
          created_at: string | null
          description: string | null
          id: number
          image_url: string | null
          label: string | null
          location: string | null
          outfit_set: string | null
          rarity: number | null
          season_category: string | null
          seasons: string | null
          slug: string
          style: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          alt_image_url?: string | null
          created_at?: string | null
          description?: string | null
          id?: number
          image_url?: string | null
          label?: string | null
          location?: string | null
          outfit_set?: string | null
          rarity?: number | null
          season_category?: string | null
          seasons?: string | null
          slug: string
          style?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          alt_image_url?: string | null
          created_at?: string | null
          description?: string | null
          id?: number
          image_url?: string | null
          label?: string | null
          location?: string | null
          outfit_set?: string | null
          rarity?: number | null
          season_category?: string | null
          seasons?: string | null
          slug?: string
          style?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "momo_cloaks_label_fkey"
            columns: ["label"]
            isOneToOne: false
            referencedRelation: "labels"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "momo_cloaks_location_fkey"
            columns: ["location"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "momo_cloaks_outfit_set_fkey"
            columns: ["outfit_set"]
            isOneToOne: false
            referencedRelation: "outfit_sets"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "momo_cloaks_season_category_fkey"
            columns: ["season_category"]
            isOneToOne: false
            referencedRelation: "season_categories"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "momo_cloaks_seasons_fkey"
            columns: ["seasons"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "momo_cloaks_style_fkey"
            columns: ["style"]
            isOneToOne: false
            referencedRelation: "styles"
            referencedColumns: ["slug"]
          },
        ]
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
      obtained_makeup: {
        Row: {
          created_at: string
          id: number
          makeup_category: string
          makeup_set: string
          makeup_variant: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: number
          makeup_category: string
          makeup_set: string
          makeup_variant: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: number
          makeup_category?: string
          makeup_set?: string
          makeup_variant?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "obtained_makeup_makeup_category_fkey"
            columns: ["makeup_category"]
            isOneToOne: false
            referencedRelation: "makeup_categories"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "obtained_makeup_makeup_set_fkey"
            columns: ["makeup_set"]
            isOneToOne: false
            referencedRelation: "makeup_sets"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "obtained_makeup_makeup_variant_fkey"
            columns: ["makeup_variant"]
            isOneToOne: false
            referencedRelation: "makeup_variants"
            referencedColumns: ["slug"]
          },
        ]
      }
      obtained_momo_cloaks: {
        Row: {
          created_at: string
          id: number
          momo_cloak: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: number
          momo_cloak: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: number
          momo_cloak?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "obtained_momo_cloaks_momo_cloak_fkey"
            columns: ["momo_cloak"]
            isOneToOne: false
            referencedRelation: "momo_cloaks"
            referencedColumns: ["slug"]
          },
        ]
      }
      obtained_outfit: {
        Row: {
          created_at: string
          id: number
          outfit_category: string
          outfit_set: string
          outfit_variant: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: number
          outfit_category: string
          outfit_set: string
          outfit_variant: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: number
          outfit_category?: string
          outfit_set?: string
          outfit_variant?: string
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
            foreignKeyName: "obtained_outfit_set_fkey"
            columns: ["outfit_set"]
            isOneToOne: false
            referencedRelation: "outfit_sets"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "obtained_outfit_variant_fkey"
            columns: ["outfit_variant"]
            isOneToOne: false
            referencedRelation: "outfit_variants"
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
          base_set: string | null
          created_at: string | null
          description: string | null
          handheld_base_only: boolean
          id: number
          image_url: string | null
          label: string | null
          label_2: string | null
          order: number
          rarity: number
          season_category: string | null
          seasons: string | null
          slug: string
          style: string | null
          subtitle: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          ability?: string | null
          alt_image_url?: string | null
          base_set?: string | null
          created_at?: string | null
          description?: string | null
          handheld_base_only?: boolean
          id?: number
          image_url?: string | null
          label?: string | null
          label_2?: string | null
          order: number
          rarity: number
          season_category?: string | null
          seasons?: string | null
          slug: string
          style?: string | null
          subtitle?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          ability?: string | null
          alt_image_url?: string | null
          base_set?: string | null
          created_at?: string | null
          description?: string | null
          handheld_base_only?: boolean
          id?: number
          image_url?: string | null
          label?: string | null
          label_2?: string | null
          order?: number
          rarity?: number
          season_category?: string | null
          seasons?: string | null
          slug?: string
          style?: string | null
          subtitle?: string | null
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
            foreignKeyName: "outfit_sets_base_set_fkey"
            columns: ["base_set"]
            isOneToOne: false
            referencedRelation: "outfit_sets"
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
          alt_slug: string | null
          created_at: string | null
          default: boolean
          description: string | null
          id: number
          image_url: string | null
          label: string | null
          label_2: string | null
          outfit_category: string | null
          outfit_set: string | null
          rarity: number | null
          season_category: string | null
          seasons: string | null
          slug: string
          style: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          alt_image_url?: string | null
          alt_slug?: string | null
          created_at?: string | null
          default?: boolean
          description?: string | null
          id?: number
          image_url?: string | null
          label?: string | null
          label_2?: string | null
          outfit_category?: string | null
          outfit_set?: string | null
          rarity?: number | null
          season_category?: string | null
          seasons?: string | null
          slug: string
          style?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          alt_image_url?: string | null
          alt_slug?: string | null
          created_at?: string | null
          default?: boolean
          description?: string | null
          id?: number
          image_url?: string | null
          label?: string | null
          label_2?: string | null
          outfit_category?: string | null
          outfit_set?: string | null
          rarity?: number | null
          season_category?: string | null
          seasons?: string | null
          slug?: string
          style?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "outfit_variants_label_2_fkey"
            columns: ["label_2"]
            isOneToOne: false
            referencedRelation: "labels"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "outfit_variants_label_fkey"
            columns: ["label"]
            isOneToOne: false
            referencedRelation: "labels"
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
          {
            foreignKeyName: "outfit_variants_season_category_fkey"
            columns: ["season_category"]
            isOneToOne: false
            referencedRelation: "season_categories"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "outfit_variants_seasons_fkey"
            columns: ["seasons"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "outfit_variants_style_fkey"
            columns: ["style"]
            isOneToOne: false
            referencedRelation: "styles"
            referencedColumns: ["slug"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          banner_url: string | null
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
          banner_url?: string | null
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
          banner_url?: string | null
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
          season_group: string | null
          slug: string
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: number
          image_url?: string | null
          season_group?: string | null
          slug: string
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: number
          image_url?: string | null
          season_group?: string | null
          slug?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "season_categories_season_group_fkey"
            columns: ["season_group"]
            isOneToOne: false
            referencedRelation: "season_groups"
            referencedColumns: ["slug"]
          },
        ]
      }
      season_groups: {
        Row: {
          created_at: string
          description: string | null
          id: number
          image_url: string | null
          slug: string
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: number
          image_url?: string | null
          slug: string
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: number
          image_url?: string | null
          slug?: string
          title?: string
          updated_at?: string | null
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
          updated_at: string | null
          use_season_groups: boolean
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
          updated_at?: string | null
          use_season_groups?: boolean
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
          updated_at?: string | null
          use_season_groups?: boolean
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
          eureka_label: string | null
          eureka_obtained_filter: string | null
          eureka_rarity: string | null
          eureka_set_filter: string | null
          eureka_style: string | null
          eureka_trial: string | null
          group_by_set: boolean
          makeup_density: string | null
          makeup_image_mode: string | null
          makeup_sort_axis: string | null
          momo_location_filter: string | null
          momo_obtained_filter: string | null
          momo_rarity_filter: string | null
          momo_season_category_filter: string | null
          momo_season_filter: string | null
          outfit_category_filter: string | null
          outfit_density: string | null
          outfit_evolution_filter: string | null
          outfit_group_by_set: boolean
          outfit_hide_evolutions: boolean
          outfit_hide_glowups: boolean
          outfit_image_mode: string | null
          outfit_label_filter: string | null
          outfit_obtained_filter: string | null
          outfit_rarity_filter: string | null
          outfit_season_category_filter: string | null
          outfit_season_filter: string | null
          outfit_set_filter: string | null
          outfit_sort_axis: string | null
          outfit_style_filter: string | null
          season_density: string | null
          season_hide_base_sets: boolean
          season_hide_evolutions: boolean
          season_hide_glowups: boolean
          season_hide_makeup: boolean
          season_hide_pieces: boolean
          season_obtained_filter: string | null
          season_rarity_filter: string | null
          season_style_filter: string | null
          show_by_color: boolean
          sort_order: string | null
          text_scale: string
          theme: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          color_theme?: string
          created_at?: string
          eureka_category?: string | null
          eureka_color?: string | null
          eureka_label?: string | null
          eureka_obtained_filter?: string | null
          eureka_rarity?: string | null
          eureka_set_filter?: string | null
          eureka_style?: string | null
          eureka_trial?: string | null
          group_by_set?: boolean
          makeup_density?: string | null
          makeup_image_mode?: string | null
          makeup_sort_axis?: string | null
          momo_location_filter?: string | null
          momo_obtained_filter?: string | null
          momo_rarity_filter?: string | null
          momo_season_category_filter?: string | null
          momo_season_filter?: string | null
          outfit_category_filter?: string | null
          outfit_density?: string | null
          outfit_evolution_filter?: string | null
          outfit_group_by_set?: boolean
          outfit_hide_evolutions?: boolean
          outfit_hide_glowups?: boolean
          outfit_image_mode?: string | null
          outfit_label_filter?: string | null
          outfit_obtained_filter?: string | null
          outfit_rarity_filter?: string | null
          outfit_season_category_filter?: string | null
          outfit_season_filter?: string | null
          outfit_set_filter?: string | null
          outfit_sort_axis?: string | null
          outfit_style_filter?: string | null
          season_density?: string | null
          season_hide_base_sets?: boolean
          season_hide_evolutions?: boolean
          season_hide_glowups?: boolean
          season_hide_makeup?: boolean
          season_hide_pieces?: boolean
          season_obtained_filter?: string | null
          season_rarity_filter?: string | null
          season_style_filter?: string | null
          show_by_color?: boolean
          sort_order?: string | null
          text_scale?: string
          theme?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          color_theme?: string
          created_at?: string
          eureka_category?: string | null
          eureka_color?: string | null
          eureka_label?: string | null
          eureka_obtained_filter?: string | null
          eureka_rarity?: string | null
          eureka_set_filter?: string | null
          eureka_style?: string | null
          eureka_trial?: string | null
          group_by_set?: boolean
          makeup_density?: string | null
          makeup_image_mode?: string | null
          makeup_sort_axis?: string | null
          momo_location_filter?: string | null
          momo_obtained_filter?: string | null
          momo_rarity_filter?: string | null
          momo_season_category_filter?: string | null
          momo_season_filter?: string | null
          outfit_category_filter?: string | null
          outfit_density?: string | null
          outfit_evolution_filter?: string | null
          outfit_group_by_set?: boolean
          outfit_hide_evolutions?: boolean
          outfit_hide_glowups?: boolean
          outfit_image_mode?: string | null
          outfit_label_filter?: string | null
          outfit_obtained_filter?: string | null
          outfit_rarity_filter?: string | null
          outfit_season_category_filter?: string | null
          outfit_season_filter?: string | null
          outfit_set_filter?: string | null
          outfit_sort_axis?: string | null
          outfit_style_filter?: string | null
          season_density?: string | null
          season_hide_base_sets?: boolean
          season_hide_evolutions?: boolean
          season_hide_glowups?: boolean
          season_hide_makeup?: boolean
          season_hide_pieces?: boolean
          season_obtained_filter?: string | null
          season_rarity_filter?: string | null
          season_style_filter?: string | null
          show_by_color?: boolean
          sort_order?: string | null
          text_scale?: string
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
      admin_entity_stats: {
        Row: {
          entity: string | null
          gaps: number | null
          no_description: number | null
          no_image: number | null
          no_title: number | null
          total: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      current_user_has_password: { Args: never; Returns: boolean }
      derive_makeup_variant_alt_slug: {
        Args: {
          p_makeup_category: string
          p_makeup_set: string
          p_title: string
        }
        Returns: string
      }
      derive_outfit_variant_alt_slug: {
        Args: {
          p_outfit_category: string
          p_outfit_set: string
          p_title: string
        }
        Returns: string
      }
      generate_unique_username: { Args: never; Returns: string }
      generate_username: { Args: { len?: number }; Returns: string }
      increment_feedback_rate_limit: {
        Args: { p_ip_hash: string; p_window_start: string }
        Returns: number
      }
      is_admin: { Args: never; Returns: boolean }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      toggle_obtained: {
        Args: { p_category: string; p_color: string; p_eureka_set: string }
        Returns: undefined
      }
      toggle_obtained_makeup: {
        Args: {
          p_makeup_category: string
          p_makeup_set: string
          p_makeup_variant: string
        }
        Returns: undefined
      }
      toggle_obtained_momo_cloak: {
        Args: { p_momo_cloak: string }
        Returns: undefined
      }
      toggle_obtained_outfit: {
        Args: {
          p_outfit_category: string
          p_outfit_set: string
          p_outfit_variant: string
        }
        Returns: undefined
      }
      unaccent_fallback: { Args: { t: string }; Returns: string }
      variant_to_slug: { Args: { name: string }; Returns: string }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
