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
      admin_action_logs: {
        Row: {
          action_type: string
          admin_id: string
          created_at: string
          details: string | null
          log_id: string
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action_type: string
          admin_id: string
          created_at?: string
          details?: string | null
          log_id?: string
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action_type?: string
          admin_id?: string
          created_at?: string
          details?: string | null
          log_id?: string
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: []
      }
      admins: {
        Row: {
          created_at: string
          notes: string | null
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          notes?: string | null
          role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          notes?: string | null
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      attendance_records: {
        Row: {
          attendance_date: string
          consecutive_days: number
          created_at: string
          points_awarded: number
          user_id: string
        }
        Insert: {
          attendance_date: string
          consecutive_days?: number
          created_at?: string
          points_awarded: number
          user_id: string
        }
        Update: {
          attendance_date?: string
          consecutive_days?: number
          created_at?: string
          points_awarded?: number
          user_id?: string
        }
        Relationships: []
      }
      badge_definitions: {
        Row: {
          badge_id: number
          category: string
          created_at: string
          description: string
          icon_url: string | null
          is_hidden: boolean
          level: string | null
          metric_type: string
          name: string
          sort_order: number
          threshold: number | null
          updated_at: string
        }
        Insert: {
          badge_id?: never
          category: string
          created_at?: string
          description: string
          icon_url?: string | null
          is_hidden?: boolean
          level?: string | null
          metric_type: string
          name: string
          sort_order?: number
          threshold?: number | null
          updated_at?: string
        }
        Update: {
          badge_id?: never
          category?: string
          created_at?: string
          description?: string
          icon_url?: string | null
          is_hidden?: boolean
          level?: string | null
          metric_type?: string
          name?: string
          sort_order?: number
          threshold?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      character_keywords: {
        Row: {
          character_id: number
          created_at: string
          description: string | null
          is_active: boolean
          keyword: string
          keyword_id: number
          priority: number
          response_template: string | null
          updated_at: string
        }
        Insert: {
          character_id: number
          created_at?: string
          description?: string | null
          is_active?: boolean
          keyword: string
          keyword_id?: never
          priority?: number
          response_template?: string | null
          updated_at?: string
        }
        Update: {
          character_id?: number
          created_at?: string
          description?: string | null
          is_active?: boolean
          keyword?: string
          keyword_id?: never
          priority?: number
          response_template?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "character_keywords_character_id_characters_character_id_fk"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["character_id"]
          },
          {
            foreignKeyName: "character_keywords_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["character_id"]
          },
        ]
      }
      character_likes: {
        Row: {
          character_id: number
          created_at: string
          like_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          character_id: number
          created_at?: string
          like_id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          character_id?: number
          created_at?: string
          like_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "character_likes_character_id_characters_character_id_fk"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["character_id"]
          },
        ]
      }
      character_safety_filters: {
        Row: {
          block_hate_speech: boolean
          block_nsfw: boolean
          block_personal_info: boolean
          block_violence: boolean
          blocked_phrases: string[] | null
          blocked_words: string[] | null
          character_id: number
          created_at: string
          filter_id: number
          sensitivity_level: number
          updated_at: string
        }
        Insert: {
          block_hate_speech?: boolean
          block_nsfw?: boolean
          block_personal_info?: boolean
          block_violence?: boolean
          blocked_phrases?: string[] | null
          blocked_words?: string[] | null
          character_id: number
          created_at?: string
          filter_id?: never
          sensitivity_level?: number
          updated_at?: string
        }
        Update: {
          block_hate_speech?: boolean
          block_nsfw?: boolean
          block_personal_info?: boolean
          block_violence?: boolean
          blocked_phrases?: string[] | null
          blocked_words?: string[] | null
          character_id?: number
          created_at?: string
          filter_id?: never
          sensitivity_level?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "character_safety_filters_character_id_characters_character_id_f"
            columns: ["character_id"]
            isOneToOne: true
            referencedRelation: "characters"
            referencedColumns: ["character_id"]
          },
          {
            foreignKeyName: "character_safety_filters_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: true
            referencedRelation: "characters"
            referencedColumns: ["character_id"]
          },
        ]
      }
      characters: {
        Row: {
          age: number | null
          age_rating: string | null
          appearance: string | null
          avatar_url: string | null
          banner_url: string | null
          category: string | null
          character_id: number
          chat_count: number
          created_at: string
          creator_id: string
          description: string | null
          display_name: string | null
          enable_memory: boolean | null
          example_dialogues: Json | null
          gallery_urls: Json | null
          gender: string | null
          greeting_message: string | null
          is_nsfw: boolean
          is_public: boolean
          like_count: number
          name: string
          personality: string | null
          personality_traits: string[] | null
          relationship: string | null
          role: string | null
          speech_style: string | null
          status: string
          system_prompt: string | null
          tagline: string | null
          tags: string[] | null
          tone: string | null
          updated_at: string
          view_count: number
          world_setting: string | null
        }
        Insert: {
          age?: number | null
          age_rating?: string | null
          appearance?: string | null
          avatar_url?: string | null
          banner_url?: string | null
          category?: string | null
          character_id?: never
          chat_count?: number
          created_at?: string
          creator_id: string
          description?: string | null
          display_name?: string | null
          enable_memory?: boolean | null
          example_dialogues?: Json | null
          gallery_urls?: Json | null
          gender?: string | null
          greeting_message?: string | null
          is_nsfw?: boolean
          is_public?: boolean
          like_count?: number
          name: string
          personality?: string | null
          personality_traits?: string[] | null
          relationship?: string | null
          role?: string | null
          speech_style?: string | null
          status?: string
          system_prompt?: string | null
          tagline?: string | null
          tags?: string[] | null
          tone?: string | null
          updated_at?: string
          view_count?: number
          world_setting?: string | null
        }
        Update: {
          age?: number | null
          age_rating?: string | null
          appearance?: string | null
          avatar_url?: string | null
          banner_url?: string | null
          category?: string | null
          character_id?: never
          chat_count?: number
          created_at?: string
          creator_id?: string
          description?: string | null
          display_name?: string | null
          enable_memory?: boolean | null
          example_dialogues?: Json | null
          gallery_urls?: Json | null
          gender?: string | null
          greeting_message?: string | null
          is_nsfw?: boolean
          is_public?: boolean
          like_count?: number
          name?: string
          personality?: string | null
          personality_traits?: string[] | null
          relationship?: string | null
          role?: string | null
          speech_style?: string | null
          status?: string
          system_prompt?: string | null
          tagline?: string | null
          tags?: string[] | null
          tone?: string | null
          updated_at?: string
          view_count?: number
          world_setting?: string | null
        }
        Relationships: []
      }
      chat_rooms: {
        Row: {
          character_id: number
          created_at: string
          last_message: string | null
          last_message_at: string | null
          message_count: number
          room_id: number
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          character_id: number
          created_at?: string
          last_message?: string | null
          last_message_at?: string | null
          message_count?: number
          room_id?: never
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          character_id?: number
          created_at?: string
          last_message?: string | null
          last_message_at?: string | null
          message_count?: number
          room_id?: never
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_rooms_character_id_characters_character_id_fk"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["character_id"]
          },
        ]
      }
      keyword_book_items: {
        Row: {
          book_id: number
          created_at: string
          description: string | null
          item_id: number
          keyword: string
          updated_at: string
        }
        Insert: {
          book_id: number
          created_at?: string
          description?: string | null
          item_id?: never
          keyword: string
          updated_at?: string
        }
        Update: {
          book_id?: number
          created_at?: string
          description?: string | null
          item_id?: never
          keyword?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "keyword_book_items_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "keyword_books"
            referencedColumns: ["keyword_book_id"]
          },
        ]
      }
      keyword_books: {
        Row: {
          book_type: string
          character_id: number | null
          created_at: string
          item_count: number
          keyword_book_id: number
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          book_type?: string
          character_id?: number | null
          created_at?: string
          item_count?: number
          keyword_book_id?: never
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          book_type?: string
          character_id?: number | null
          created_at?: string
          item_count?: number
          keyword_book_id?: never
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "keyword_books_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["character_id"]
          },
        ]
      }
      messages: {
        Row: {
          branch_name: string | null
          content: string
          cost: number | null
          created_at: string
          is_active_branch: number
          is_deleted: number
          message_id: number
          parent_message_id: number | null
          role: string
          room_id: number
          sequence_number: number
          tokens_used: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          branch_name?: string | null
          content: string
          cost?: number | null
          created_at?: string
          is_active_branch?: number
          is_deleted?: number
          message_id?: never
          parent_message_id?: number | null
          role: string
          room_id: number
          sequence_number: number
          tokens_used?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          branch_name?: string | null
          content?: string
          cost?: number | null
          created_at?: string
          is_active_branch?: number
          is_deleted?: number
          message_id?: never
          parent_message_id?: number | null
          role?: string
          room_id?: number
          sequence_number?: number
          tokens_used?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_room_id_chat_rooms_room_id_fk"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["room_id"]
          },
        ]
      }
      notices: {
        Row: {
          author_id: string
          content: string
          created_at: string
          notice_id: number
          published_at: string | null
          slug: string
          status: string
          tag: string | null
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          notice_id?: never
          published_at?: string | null
          slug: string
          status?: string
          tag?: string | null
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          notice_id?: never
          published_at?: string | null
          slug?: string
          status?: string
          tag?: string | null
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          approved_at: string
          created_at: string
          metadata: Json
          order_id: string
          order_name: string
          payment_id: number
          payment_key: string
          raw_data: Json
          receipt_url: string
          requested_at: string
          status: string
          total_amount: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          approved_at: string
          created_at?: string
          metadata: Json
          order_id: string
          order_name: string
          payment_id?: never
          payment_key: string
          raw_data: Json
          receipt_url: string
          requested_at: string
          status: string
          total_amount: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          approved_at?: string
          created_at?: string
          metadata?: Json
          order_id?: string
          order_name?: string
          payment_id?: never
          payment_key?: string
          raw_data?: Json
          receipt_url?: string
          requested_at?: string
          status?: string
          total_amount?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      point_transactions: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          reason: string
          reference_id: string | null
          transaction_id: number
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string
          reason: string
          reference_id?: string | null
          transaction_id?: never
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          reason?: string
          reference_id?: string | null
          transaction_id?: never
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          badge_type: string
          bio: string | null
          created_at: string
          follower_count: number
          following_count: number
          marketing_consent: boolean
          name: string
          profile_id: string
          referral_code: string | null
          updated_at: string
          verified_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          badge_type?: string
          bio?: string | null
          created_at?: string
          follower_count?: number
          following_count?: number
          marketing_consent?: boolean
          name: string
          profile_id: string
          referral_code?: string | null
          updated_at?: string
          verified_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          badge_type?: string
          bio?: string | null
          created_at?: string
          follower_count?: number
          following_count?: number
          marketing_consent?: boolean
          name?: string
          profile_id?: string
          referral_code?: string | null
          updated_at?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      referrals: {
        Row: {
          created_at: string
          referee_id: string
          referral_code: string
          referral_id: string
          referrer_id: string
          reward_status: string
        }
        Insert: {
          created_at?: string
          referee_id: string
          referral_code: string
          referral_id?: string
          referrer_id: string
          reward_status?: string
        }
        Update: {
          created_at?: string
          referee_id?: string
          referral_code?: string
          referral_id?: string
          referrer_id?: string
          reward_status?: string
        }
        Relationships: []
      }
      room_memories: {
        Row: {
          content: string
          created_at: string
          importance: number
          memory_id: number
          memory_type: string
          message_range_end: number | null
          message_range_start: number | null
          metadata: Json | null
          room_id: number
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          importance?: number
          memory_id?: never
          memory_type: string
          message_range_end?: number | null
          message_range_start?: number | null
          metadata?: Json | null
          room_id: number
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          importance?: number
          memory_id?: never
          memory_type?: string
          message_range_end?: number | null
          message_range_start?: number | null
          metadata?: Json | null
          room_id?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_memories_room_id_chat_rooms_room_id_fk"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["room_id"]
          },
        ]
      }
      user_badges: {
        Row: {
          badge_id: number
          claimed_at: string
          created_at: string
          is_representative: boolean
          updated_at: string
          user_badge_id: number
          user_id: string
        }
        Insert: {
          badge_id: number
          claimed_at?: string
          created_at?: string
          is_representative?: boolean
          updated_at?: string
          user_badge_id?: never
          user_id: string
        }
        Update: {
          badge_id?: number
          claimed_at?: string
          created_at?: string
          is_representative?: boolean
          updated_at?: string
          user_badge_id?: never
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badge_definitions"
            referencedColumns: ["badge_id"]
          },
        ]
      }
      user_follows: {
        Row: {
          created_at: string
          follow_id: string
          follower_id: string
          following_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          follow_id?: string
          follower_id: string
          following_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          follow_id?: string
          follower_id?: string
          following_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_points: {
        Row: {
          current_balance: number
          total_earned: number
          total_spent: number
          updated_at: string
          user_id: string
        }
        Insert: {
          current_balance?: number
          total_earned?: number
          total_spent?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          current_balance?: number
          total_earned?: number
          total_spent?: number
          updated_at?: string
          user_id?: string
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
      character_status:
        | "draft"
        | "pending_review"
        | "approved"
        | "rejected"
        | "archived"
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
      character_status: [
        "draft",
        "pending_review",
        "approved",
        "rejected",
        "archived",
      ],
    },
  },
} as const
