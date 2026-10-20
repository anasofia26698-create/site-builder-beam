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
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      fapp_campaigns: {
        Row: {
          id: string
          payload: Json
          record_id: string
        }
        Insert: {
          id?: string
          payload: Json
          record_id: string
        }
        Update: {
          id?: string
          payload?: Json
          record_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fapp_campaigns_record_id_fkey"
            columns: ["record_id"]
            isOneToOne: false
            referencedRelation: "fapp_monthly_records"
            referencedColumns: ["id"]
          },
        ]
      }
      fapp_monthly_records: {
        Row: {
          id: string
          payload: Json
          reference_month: string
          store_id: string
          updated_at: string
          updated_by: string
          workspace_id: string
        }
        Insert: {
          id?: string
          payload?: Json
          reference_month: string
          store_id: string
          updated_at?: string
          updated_by: string
          workspace_id?: string
        }
        Update: {
          id?: string
          payload?: Json
          reference_month?: string
          store_id?: string
          updated_at?: string
          updated_by?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fapp_monthly_records_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "store_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      fapp_payments: {
        Row: {
          id: string
          payload: Json
          record_id: string
        }
        Insert: {
          id?: string
          payload: Json
          record_id: string
        }
        Update: {
          id?: string
          payload?: Json
          record_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fapp_payments_record_id_fkey"
            columns: ["record_id"]
            isOneToOne: false
            referencedRelation: "fapp_monthly_records"
            referencedColumns: ["id"]
          },
        ]
      }
      fapp_products: {
        Row: {
          id: string
          payload: Json
          record_id: string
        }
        Insert: {
          id?: string
          payload: Json
          record_id: string
        }
        Update: {
          id?: string
          payload?: Json
          record_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fapp_products_record_id_fkey"
            columns: ["record_id"]
            isOneToOne: false
            referencedRelation: "fapp_monthly_records"
            referencedColumns: ["id"]
          },
        ]
      }
      store_catalog: {
        Row: {
          city: string
          id: string
          name: string
        }
        Insert: {
          city?: string
          id: string
          name: string
        }
        Update: {
          city?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      store_identity_migration_backup: {
        Row: {
          created_at: string
          id: string
          original_id: string
          row_data: Json
          source_table: string
        }
        Insert: {
          created_at?: string
          id?: string
          original_id: string
          row_data: Json
          source_table: string
        }
        Update: {
          created_at?: string
          id?: string
          original_id?: string
          row_data?: Json
          source_table?: string
        }
        Relationships: []
      }
      store_records: {
        Row: {
          adInvestment: number
          adNewCustomers: number
          adOrders: number
          adSales: number
          adTicket: number
          adVisits: number
          cac: number
          city: string
          cmv: number
          conversion: number
          costPerOrder: number
          created_at: string
          grossSales: number
          id: string
          ifoodPromoInvestment: number
          name: string
          newCustomers: number
          orders: number
          productsJson: string
          promoNewCustomers: number
          promoOrders: number
          promoReturn: number
          promoSales: number
          promoTicket: number
          recoveredCustomers: number
          referenceMonth: string
          roas: number
          status: string
          storePromoInvestment: number
          updated_at: string
        }
        Insert: {
          adInvestment?: number
          adNewCustomers?: number
          adOrders?: number
          adSales?: number
          adTicket?: number
          adVisits?: number
          cac?: number
          city?: string
          cmv?: number
          conversion?: number
          costPerOrder?: number
          created_at?: string
          grossSales?: number
          id: string
          ifoodPromoInvestment?: number
          name?: string
          newCustomers?: number
          orders?: number
          productsJson?: string
          promoNewCustomers?: number
          promoOrders?: number
          promoReturn?: number
          promoSales?: number
          promoTicket?: number
          recoveredCustomers?: number
          referenceMonth?: string
          roas?: number
          status?: string
          storePromoInvestment?: number
          updated_at?: string
        }
        Update: {
          adInvestment?: number
          adNewCustomers?: number
          adOrders?: number
          adSales?: number
          adTicket?: number
          adVisits?: number
          cac?: number
          city?: string
          cmv?: number
          conversion?: number
          costPerOrder?: number
          created_at?: string
          grossSales?: number
          id?: string
          ifoodPromoInvestment?: number
          name?: string
          newCustomers?: number
          orders?: number
          productsJson?: string
          promoNewCustomers?: number
          promoOrders?: number
          promoReturn?: number
          promoSales?: number
          promoTicket?: number
          recoveredCustomers?: number
          referenceMonth?: string
          roas?: number
          status?: string
          storePromoInvestment?: number
          updated_at?: string
        }
        Relationships: []
      }
      store_snapshots: {
        Row: {
          adInvestment: number
          adNewCustomers: number
          adOrders: number
          adSales: number
          adTicket: number
          adVisits: number
          cac: number
          city: string
          cmv: number
          conversion: number
          costPerOrder: number
          created_at: string
          grossSales: number
          id: string
          ifoodPromoInvestment: number
          name: string
          newCustomers: number
          orders: number
          productsJson: string
          promoNewCustomers: number
          promoOrders: number
          promoReturn: number
          promoSales: number
          promoTicket: number
          recoveredCustomers: number
          referenceMonth: string
          roas: number
          status: string
          storeId: string
          storePromoInvestment: number
          updated_at: string
        }
        Insert: {
          adInvestment?: number
          adNewCustomers?: number
          adOrders?: number
          adSales?: number
          adTicket?: number
          adVisits?: number
          cac?: number
          city?: string
          cmv?: number
          conversion?: number
          costPerOrder?: number
          created_at?: string
          grossSales?: number
          id?: string
          ifoodPromoInvestment?: number
          name?: string
          newCustomers?: number
          orders?: number
          productsJson?: string
          promoNewCustomers?: number
          promoOrders?: number
          promoReturn?: number
          promoSales?: number
          promoTicket?: number
          recoveredCustomers?: number
          referenceMonth: string
          roas?: number
          status?: string
          storeId: string
          storePromoInvestment?: number
          updated_at?: string
        }
        Update: {
          adInvestment?: number
          adNewCustomers?: number
          adOrders?: number
          adSales?: number
          adTicket?: number
          adVisits?: number
          cac?: number
          city?: string
          cmv?: number
          conversion?: number
          costPerOrder?: number
          created_at?: string
          grossSales?: number
          id?: string
          ifoodPromoInvestment?: number
          name?: string
          newCustomers?: number
          orders?: number
          productsJson?: string
          promoNewCustomers?: number
          promoOrders?: number
          promoReturn?: number
          promoSales?: number
          promoTicket?: number
          recoveredCustomers?: number
          referenceMonth?: string
          roas?: number
          status?: string
          storeId?: string
          storePromoInvestment?: number
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
      workspace_invitations: {
        Row: {
          accepted_by: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          accepted_by?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          accepted_by?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
      }
      workspace_members: {
        Row: {
          created_at: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          user_id: string
          workspace_id?: string
        }
        Update: {
          created_at?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_fapp_invitation: { Args: never; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_fapp_member: { Args: never; Returns: boolean }
      save_fapp_record: {
        Args: { p_confirmed?: boolean; p_payload: Json }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "member"
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
    Enums: {
      app_role: ["admin", "member"],
    },
  },
} as const
