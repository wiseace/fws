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
            referencedRelation: "users"
            referencedColumns: ["id"]
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
          contact_info: Json
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          location: string | null
          service_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          contact_info?: Json
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          location?: string | null
          service_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          contact_info?: Json
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          location?: string | null
          service_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
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
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          can_access_contact: boolean | null
          created_at: string
          email: string
          id: string
          is_verified: boolean
          name: string
          phone: string | null
          subscription_expiry: string | null
          subscription_plan:
            | Database["public"]["Enums"]["subscription_plan"]
            | null
          subscription_status: Database["public"]["Enums"]["subscription_status"]
          updated_at: string
          user_type: Database["public"]["Enums"]["user_type"]
          verification_documents: Json | null
          verification_status:
            | Database["public"]["Enums"]["verification_status"]
            | null
        }
        Insert: {
          can_access_contact?: boolean | null
          created_at?: string
          email: string
          id: string
          is_verified?: boolean
          name: string
          phone?: string | null
          subscription_expiry?: string | null
          subscription_plan?:
            | Database["public"]["Enums"]["subscription_plan"]
            | null
          subscription_status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
          user_type?: Database["public"]["Enums"]["user_type"]
          verification_documents?: Json | null
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
        }
        Update: {
          can_access_contact?: boolean | null
          created_at?: string
          email?: string
          id?: string
          is_verified?: boolean
          name?: string
          phone?: string | null
          subscription_expiry?: string | null
          subscription_plan?:
            | Database["public"]["Enums"]["subscription_plan"]
            | null
          subscription_status?: Database["public"]["Enums"]["subscription_status"]
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
            referencedRelation: "users"
            referencedColumns: ["id"]
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
      [_ in never]: never
    }
    Functions: {
      can_access_contact_info: {
        Args: { user_id: string }
        Returns: boolean
      }
      check_user_owns_resource: {
        Args: { resource_user_id: string }
        Returns: boolean
      }
      complete_onboarding_step: {
        Args: { step_name: string }
        Returns: undefined
      }
      create_manual_admin_user: {
        Args: Record<PropertyKey, never>
        Returns: undefined
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
      is_current_user_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      make_user_admin: {
        Args: { user_email: string }
        Returns: undefined
      }
      update_user_profile: {
        Args: { user_name?: string; user_phone?: string }
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
