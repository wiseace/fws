export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      admin_user_messages: {
        Row: {
          admin_id: string
          created_at: string
          id: string
          is_from_admin: boolean
          message: string
          message_type: string
          read_by_recipient: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_id: string
          created_at?: string
          id?: string
          is_from_admin?: boolean
          message: string
          message_type?: string
          read_by_recipient?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_id?: string
          created_at?: string
          id?: string
          is_from_admin?: boolean
          message?: string
          message_type?: string
          read_by_recipient?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      contact_requests: {
        Row: {
          contact_method: string | null
          created_at: string | null
          id: string
          message: string | null
          provider_id: string | null
          seeker_id: string | null
          service_id: string | null
        }
        Insert: {
          contact_method?: string | null
          created_at?: string | null
          id?: string
          message?: string | null
          provider_id?: string | null
          seeker_id?: string | null
          service_id?: string | null
        }
        Update: {
          contact_method?: string | null
          created_at?: string | null
          id?: string
          message?: string | null
          provider_id?: string | null
          seeker_id?: string | null
          service_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_requests_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "provider_wizard_progress"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "contact_requests_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_requests_seeker_id_fkey"
            columns: ["seeker_id"]
            isOneToOne: false
            referencedRelation: "provider_wizard_progress"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "contact_requests_seeker_id_fkey"
            columns: ["seeker_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_requests_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          category: string
          city: string | null
          contact_info: Json
          country: string | null
          created_at: string
          description: string | null
          formatted_address: string | null
          id: string
          image_url: string | null
          is_active: boolean
          latitude: number | null
          location: string | null
          longitude: number | null
          postal_code: string | null
          price_range_max: number | null
          price_range_min: number | null
          service_name: string
          skills: string[] | null
          state: string | null
          tags: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          city?: string | null
          contact_info?: Json
          country?: string | null
          created_at?: string
          description?: string | null
          formatted_address?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          postal_code?: string | null
          price_range_max?: number | null
          price_range_min?: number | null
          service_name: string
          skills?: string[] | null
          state?: string | null
          tags?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          city?: string | null
          contact_info?: Json
          country?: string | null
          created_at?: string
          description?: string | null
          formatted_address?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          postal_code?: string | null
          price_range_max?: number | null
          price_range_min?: number | null
          service_name?: string
          skills?: string[] | null
          state?: string | null
          tags?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "provider_wizard_progress"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "services_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_notifications: {
        Row: {
          action_url: string | null
          created_at: string | null
          id: string
          message: string
          read: boolean | null
          title: string
          type: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string | null
          id?: string
          message: string
          read?: boolean | null
          title: string
          type?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string | null
          id?: string
          message?: string
          read?: boolean | null
          title?: string
          type?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "provider_wizard_progress"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_onboarding: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          id: string
          step_name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          step_name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          step_name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_onboarding_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "provider_wizard_progress"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_onboarding_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          address: string | null
          availability_status: string | null
          can_access_contact: boolean | null
          city: string | null
          city_or_state: string | null
          country: string | null
          created_at: string
          email: string
          formatted_address: string | null
          id: string
          is_verified: boolean
          last_active: string | null
          latitude: number | null
          longitude: number | null
          name: string
          phone: string | null
          postal_code: string | null
          price_range_max: number | null
          price_range_min: number | null
          profile_image_url: string | null
          service_location: string | null
          skills: string[] | null
          state: string | null
          subscription_expiry: string | null
          subscription_plan:
            | Database["public"]["Enums"]["subscription_plan"]
            | null
          subscription_status: Database["public"]["Enums"]["subscription_status"]
          tags: string[] | null
          updated_at: string
          user_type: Database["public"]["Enums"]["user_type"]
          verification_documents: Json | null
          verification_status:
            | Database["public"]["Enums"]["verification_status"]
            | null
        }
        Insert: {
          address?: string | null
          availability_status?: string | null
          can_access_contact?: boolean | null
          city?: string | null
          city_or_state?: string | null
          country?: string | null
          created_at?: string
          email: string
          formatted_address?: string | null
          id: string
          is_verified?: boolean
          last_active?: string | null
          latitude?: number | null
          longitude?: number | null
          name: string
          phone?: string | null
          postal_code?: string | null
          price_range_max?: number | null
          price_range_min?: number | null
          profile_image_url?: string | null
          service_location?: string | null
          skills?: string[] | null
          state?: string | null
          subscription_expiry?: string | null
          subscription_plan?:
            | Database["public"]["Enums"]["subscription_plan"]
            | null
          subscription_status?: Database["public"]["Enums"]["subscription_status"]
          tags?: string[] | null
          updated_at?: string
          user_type?: Database["public"]["Enums"]["user_type"]
          verification_documents?: Json | null
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
        }
        Update: {
          address?: string | null
          availability_status?: string | null
          can_access_contact?: boolean | null
          city?: string | null
          city_or_state?: string | null
          country?: string | null
          created_at?: string
          email?: string
          formatted_address?: string | null
          id?: string
          is_verified?: boolean
          last_active?: string | null
          latitude?: number | null
          longitude?: number | null
          name?: string
          phone?: string | null
          postal_code?: string | null
          price_range_max?: number | null
          price_range_min?: number | null
          profile_image_url?: string | null
          service_location?: string | null
          skills?: string[] | null
          state?: string | null
          subscription_expiry?: string | null
          subscription_plan?:
            | Database["public"]["Enums"]["subscription_plan"]
            | null
          subscription_status?: Database["public"]["Enums"]["subscription_status"]
          tags?: string[] | null
          updated_at?: string
          user_type?: Database["public"]["Enums"]["user_type"]
          verification_documents?: Json | null
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
        }
        Relationships: []
      }
      verification_requests: {
        Row: {
          additional_info: string | null
          created_at: string | null
          full_name: string
          id: string
          id_document_url: string | null
          phone_number: string
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          skill_proof_url: string | null
          status: Database["public"]["Enums"]["verification_status"] | null
          submitted_at: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          additional_info?: string | null
          created_at?: string | null
          full_name: string
          id?: string
          id_document_url?: string | null
          phone_number: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          skill_proof_url?: string | null
          status?: Database["public"]["Enums"]["verification_status"] | null
          submitted_at?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          additional_info?: string | null
          created_at?: string | null
          full_name?: string
          id?: string
          id_document_url?: string | null
          phone_number?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          skill_proof_url?: string | null
          status?: Database["public"]["Enums"]["verification_status"] | null
          submitted_at?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "verification_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "provider_wizard_progress"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "verification_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verification_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "provider_wizard_progress"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "verification_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      provider_wizard_progress: {
        Row: {
          progress_percent: number | null
          step_1_complete: boolean | null
          step_2_complete: boolean | null
          step_3_complete: boolean | null
          step_4_complete: boolean | null
          user_id: string | null
        }
        Insert: {
          progress_percent?: never
          step_1_complete?: never
          step_2_complete?: never
          step_3_complete?: never
          step_4_complete?: never
          user_id?: string | null
        }
        Update: {
          progress_percent?: never
          step_1_complete?: never
          step_2_complete?: never
          step_3_complete?: never
          step_4_complete?: never
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      admin_delete_user: {
        Args: { target_user_id: string; admin_reason: string }
        Returns: undefined
      }
      admin_unverify_user: {
        Args: { target_user_id: string; admin_reason: string }
        Returns: undefined
      }
      admin_update_user_role: {
        Args: {
          target_user_id: string
          new_user_type: Database["public"]["Enums"]["user_type"]
          admin_notes?: string
        }
        Returns: undefined
      }
      can_access_contact_info: {
        Args: { user_id: string }
        Returns: boolean
      }
      check_user_owns_resource: {
        Args: { resource_user_id: string }
        Returns: boolean
      }
      complete_onboarding_step: {
        Args: { input_step_name: string }
        Returns: undefined
      }
      create_contact_request: {
        Args: {
          provider_id: string
          service_id: string
          message: string
          contact_method?: string
        }
        Returns: string
      }
      create_manual_admin_user: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      debug_admin_access: {
        Args: Record<PropertyKey, never>
        Returns: {
          auth_uid: string
          is_admin: boolean
          user_type: string
          user_email: string
        }[]
      }
      delete_user_and_related_data: {
        Args: { target_user_id: string }
        Returns: undefined
      }
      get_admin_stats: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_current_user_type: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_admin_messages: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          admin_id: string
          message: string
          message_type: string
          is_from_admin: boolean
          read_by_recipient: boolean
          created_at: string
          admin_name: string
        }[]
      }
      is_current_user_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      make_user_admin: {
        Args: { user_email: string }
        Returns: undefined
      }
      mark_admin_message_read: {
        Args: { message_id: string }
        Returns: undefined
      }
      send_admin_reply: {
        Args: { reply_message: string; reply_type?: string }
        Returns: undefined
      }
      smart_search_providers: {
        Args: {
          search_term?: string
          search_location?: string
          min_price?: number
          max_price?: number
          availability_only?: boolean
          user_lat?: number
          user_lng?: number
        }
        Returns: {
          user_id: string
          name: string
          email: string
          phone: string
          profile_image_url: string
          skills: string[]
          tags: string[]
          service_location: string
          city_or_state: string
          availability_status: string
          price_range_min: number
          price_range_max: number
          last_active: string
          service_id: string
          service_name: string
          service_description: string
          service_category: string
          service_price_min: number
          service_price_max: number
          match_score: number
        }[]
      }
      update_user_profile: {
        Args:
          | { user_name?: string; user_phone?: string; user_address?: string }
          | {
              user_name?: string
              user_phone?: string
              user_address?: string
              user_latitude?: number
              user_longitude?: number
              user_city?: string
              user_state?: string
              user_country?: string
              user_postal_code?: string
              user_formatted_address?: string
            }
        Returns: undefined
      }
      update_verification_status: {
        Args: {
          request_id: string
          new_status: Database["public"]["Enums"]["verification_status"]
          notes?: string
        }
        Returns: undefined
      }
      validate_user_subscription: {
        Args: { user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      subscription_plan: "free" | "monthly" | "semi_annual" | "yearly"
      subscription_status: "free" | "monthly" | "semi_annual" | "yearly"
      user_type: "provider" | "seeker" | "admin"
      verification_status: "not_verified" | "pending" | "verified" | "rejected"
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
      subscription_plan: ["free", "monthly", "semi_annual", "yearly"],
      subscription_status: ["free", "monthly", "semi_annual", "yearly"],
      user_type: ["provider", "seeker", "admin"],
      verification_status: ["not_verified", "pending", "verified", "rejected"],
    },
  },
} as const
