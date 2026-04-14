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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      assembly_items: {
        Row: {
          assembly_list_id: string
          created_at: string
          id: string
          quantity: number
          stock_item_id: string
        }
        Insert: {
          assembly_list_id: string
          created_at?: string
          id?: string
          quantity?: number
          stock_item_id: string
        }
        Update: {
          assembly_list_id?: string
          created_at?: string
          id?: string
          quantity?: number
          stock_item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assembly_items_assembly_list_id_fkey"
            columns: ["assembly_list_id"]
            isOneToOne: false
            referencedRelation: "assembly_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      assembly_lists: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          product_name: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id: string
          name: string
          product_name?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          product_name?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          assembly_list_id: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          min_quantity: number
          name: string
          quantity_produced: number
          sku: string
        }
        Insert: {
          assembly_list_id?: string | null
          created_at?: string
          description?: string | null
          id: string
          image_url?: string | null
          min_quantity?: number
          name: string
          quantity_produced?: number
          sku?: string
        }
        Update: {
          assembly_list_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          min_quantity?: number
          name?: string
          quantity_produced?: number
          sku?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          is_approved: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
          is_approved?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          is_approved?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      shopping_list_items: {
        Row: {
          checked: boolean
          created_at: string
          id: string
          name: string
          quantity: number
          shopping_list_id: string
          sku: string | null
          supplier: string | null
          supplier_link: string | null
          unit: string | null
        }
        Insert: {
          checked?: boolean
          created_at?: string
          id?: string
          name: string
          quantity?: number
          shopping_list_id: string
          sku?: string | null
          supplier?: string | null
          supplier_link?: string | null
          unit?: string | null
        }
        Update: {
          checked?: boolean
          created_at?: string
          id?: string
          name?: string
          quantity?: number
          shopping_list_id?: string
          sku?: string | null
          supplier?: string | null
          supplier_link?: string | null
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shopping_list_items_shopping_list_id_fkey"
            columns: ["shopping_list_id"]
            isOneToOne: false
            referencedRelation: "shopping_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      shopping_lists: {
        Row: {
          archived_at: string | null
          created_at: string
          id: string
          name: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          id?: string
          name?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          id?: string
          name?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      stock_items: {
        Row: {
          category: string
          component_footprint: string | null
          component_value: string | null
          component_voltage: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          link: string | null
          location: string | null
          min_quantity: number
          name: string
          price: number
          quantity: number
          screw_length: string | null
          screw_shape: string | null
          screw_type: string | null
          sku: string
          supplier: string | null
          supplier_link: string | null
          supplier_ref: string | null
          unit: string | null
          updated_at: string
        }
        Insert: {
          category?: string
          component_footprint?: string | null
          component_value?: string | null
          component_voltage?: string | null
          created_at?: string
          description?: string | null
          id: string
          image_url?: string | null
          link?: string | null
          location?: string | null
          min_quantity?: number
          name: string
          price?: number
          quantity?: number
          screw_length?: string | null
          screw_shape?: string | null
          screw_type?: string | null
          sku?: string
          supplier?: string | null
          supplier_link?: string | null
          supplier_ref?: string | null
          unit?: string | null
          updated_at?: string
        }
        Update: {
          category?: string
          component_footprint?: string | null
          component_value?: string | null
          component_voltage?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          link?: string | null
          location?: string | null
          min_quantity?: number
          name?: string
          price?: number
          quantity?: number
          screw_length?: string | null
          screw_shape?: string | null
          screw_type?: string | null
          sku?: string
          supplier?: string | null
          supplier_link?: string | null
          supplier_ref?: string | null
          unit?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_approved: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
