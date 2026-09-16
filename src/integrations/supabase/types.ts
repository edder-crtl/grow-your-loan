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
      amortizaciones: {
        Row: {
          capital: number
          created_at: string
          cuota: number
          fecha_pago: string | null
          fecha_vencimiento: string
          id: string
          interes: number
          numero_cuota: number
          pagada: boolean
          saldo: number
          solicitud_id: string
          user_id: string
        }
        Insert: {
          capital: number
          created_at?: string
          cuota: number
          fecha_pago?: string | null
          fecha_vencimiento: string
          id?: string
          interes: number
          numero_cuota: number
          pagada?: boolean
          saldo: number
          solicitud_id: string
          user_id: string
        }
        Update: {
          capital?: number
          created_at?: string
          cuota?: number
          fecha_pago?: string | null
          fecha_vencimiento?: string
          id?: string
          interes?: number
          numero_cuota?: number
          pagada?: boolean
          saldo?: number
          solicitud_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "amortizaciones_solicitud_id_fkey"
            columns: ["solicitud_id"]
            isOneToOne: false
            referencedRelation: "solicitudes"
            referencedColumns: ["id"]
          },
        ]
      }
      productos_financieros: {
        Row: {
          activo: boolean
          comision_apertura_pct: number
          created_at: string
          descripcion: string
          id: string
          monto_max: number
          monto_min: number
          nombre: string
          plazo_max: number
          plazo_min: number
          tasa_mensual: number
          tasa_mora_mensual: number
          tipo_tasa: string
        }
        Insert: {
          activo?: boolean
          comision_apertura_pct?: number
          created_at?: string
          descripcion?: string
          id?: string
          monto_max: number
          monto_min: number
          nombre: string
          plazo_max?: number
          plazo_min?: number
          tasa_mensual: number
          tasa_mora_mensual?: number
          tipo_tasa?: string
        }
        Update: {
          activo?: boolean
          comision_apertura_pct?: number
          created_at?: string
          descripcion?: string
          id?: string
          monto_max?: number
          monto_min?: number
          nombre?: string
          plazo_max?: number
          plazo_min?: number
          tasa_mensual?: number
          tasa_mora_mensual?: number
          tipo_tasa?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          antiguedad_laboral_meses: number
          created_at: string
          deuda_actual: number
          gastos_fijos: number
          id: string
          ingresos_mensuales: number
          nombre: string
          ocupacion: string
          updated_at: string
        }
        Insert: {
          antiguedad_laboral_meses?: number
          created_at?: string
          deuda_actual?: number
          gastos_fijos?: number
          id: string
          ingresos_mensuales?: number
          nombre?: string
          ocupacion?: string
          updated_at?: string
        }
        Update: {
          antiguedad_laboral_meses?: number
          created_at?: string
          deuda_actual?: number
          gastos_fijos?: number
          id?: string
          ingresos_mensuales?: number
          nombre?: string
          ocupacion?: string
          updated_at?: string
        }
        Relationships: []
      }
      solicitudes: {
        Row: {
          comision_apertura: number
          created_at: string
          cuota_mensual: number
          estado: string
          fecha_desembolso: string
          id: string
          monto: number
          plazo_meses: number
          producto_id: string | null
          producto_nombre: string
          tasa_mensual: number
          total_intereses: number
          total_pagar: number
          user_id: string
        }
        Insert: {
          comision_apertura?: number
          created_at?: string
          cuota_mensual: number
          estado?: string
          fecha_desembolso?: string
          id?: string
          monto: number
          plazo_meses: number
          producto_id?: string | null
          producto_nombre?: string
          tasa_mensual: number
          total_intereses: number
          total_pagar: number
          user_id: string
        }
        Update: {
          comision_apertura?: number
          created_at?: string
          cuota_mensual?: number
          estado?: string
          fecha_desembolso?: string
          id?: string
          monto?: number
          plazo_meses?: number
          producto_id?: string | null
          producto_nombre?: string
          tasa_mensual?: number
          total_intereses?: number
          total_pagar?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "solicitudes_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos_financieros"
            referencedColumns: ["id"]
          },
        ]
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
