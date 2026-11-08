export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18";
  };
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      bitacora: {
        Row: {
          accion: string;
          created_at: string;
          detalle: Json;
          entidad: string;
          entidad_id: string;
          id: number;
          usuario_id: string | null;
        };
        Insert: {
          accion: string;
          created_at?: string;
          detalle?: Json;
          entidad: string;
          entidad_id: string;
          id?: never;
          usuario_id?: string | null;
        };
        Update: {
          accion?: string;
          created_at?: string;
          detalle?: Json;
          entidad?: string;
          entidad_id?: string;
          id?: never;
          usuario_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "bitacora_usuario_id_fkey";
            columns: ["usuario_id"];
            isOneToOne: false;
            referencedRelation: "usuarios";
            referencedColumns: ["id"];
          },
        ];
      };
      categorias: {
        Row: {
          color_hex: string;
          id: string;
          nombre: string;
          orden: number;
          precio: number;
        };
        Insert: {
          color_hex: string;
          id: string;
          nombre: string;
          orden: number;
          precio: number;
        };
        Update: {
          color_hex?: string;
          id?: string;
          nombre?: string;
          orden?: number;
          precio?: number;
        };
        Relationships: [];
      };
      compradores: {
        Row: {
          apellido: string;
          created_at: string;
          created_by: string;
          documento: string;
          id: string;
          nombre: string;
          recomendado_por: string | null;
          telefono: string;
          updated_at: string;
        };
        Insert: {
          apellido: string;
          created_at?: string;
          created_by: string;
          documento: string;
          id?: string;
          nombre: string;
          recomendado_por?: string | null;
          telefono: string;
          updated_at?: string;
        };
        Update: {
          apellido?: string;
          created_at?: string;
          created_by?: string;
          documento?: string;
          id?: string;
          nombre?: string;
          recomendado_por?: string | null;
          telefono?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "compradores_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "usuarios";
            referencedColumns: ["id"];
          },
        ];
      };
      devoluciones: {
        Row: {
          comprobante_path: string | null;
          created_at: string;
          fecha_devolucion: string;
          id: string;
          monto: number;
          referencia: string | null;
          registrado_por: string;
          venta_id: string;
        };
        Insert: {
          comprobante_path?: string | null;
          created_at?: string;
          fecha_devolucion: string;
          id: string;
          monto: number;
          referencia?: string | null;
          registrado_por: string;
          venta_id: string;
        };
        Update: {
          comprobante_path?: string | null;
          created_at?: string;
          fecha_devolucion?: string;
          id?: string;
          monto?: number;
          referencia?: string | null;
          registrado_por?: string;
          venta_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "devoluciones_registrado_por_fkey";
            columns: ["registrado_por"];
            isOneToOne: false;
            referencedRelation: "usuarios";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "devoluciones_venta_id_fkey";
            columns: ["venta_id"];
            isOneToOne: true;
            referencedRelation: "v_palcos";
            referencedColumns: ["venta_id"];
          },
          {
            foreignKeyName: "devoluciones_venta_id_fkey";
            columns: ["venta_id"];
            isOneToOne: true;
            referencedRelation: "ventas";
            referencedColumns: ["id"];
          },
        ];
      };
      pago_aplicaciones: {
        Row: {
          id: string;
          monto: number;
          pago_id: string;
          venta_id: string;
        };
        Insert: {
          id?: string;
          monto: number;
          pago_id: string;
          venta_id: string;
        };
        Update: {
          id?: string;
          monto?: number;
          pago_id?: string;
          venta_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "pago_aplicaciones_pago_id_fkey";
            columns: ["pago_id"];
            isOneToOne: false;
            referencedRelation: "pagos";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "pago_aplicaciones_venta_id_fkey";
            columns: ["venta_id"];
            isOneToOne: false;
            referencedRelation: "v_palcos";
            referencedColumns: ["venta_id"];
          },
          {
            foreignKeyName: "pago_aplicaciones_venta_id_fkey";
            columns: ["venta_id"];
            isOneToOne: false;
            referencedRelation: "ventas";
            referencedColumns: ["id"];
          },
        ];
      };
      pagos: {
        Row: {
          anulado: boolean;
          anulado_en: string | null;
          anulado_motivo: string | null;
          anulado_por: string | null;
          comprador_id: string;
          comprobante_path: string | null;
          created_at: string;
          fecha_pago: string;
          id: string;
          monto: number;
          nota: string | null;
          referencia: string | null;
          registrado_por: string;
        };
        Insert: {
          anulado?: boolean;
          anulado_en?: string | null;
          anulado_motivo?: string | null;
          anulado_por?: string | null;
          comprador_id: string;
          comprobante_path?: string | null;
          created_at?: string;
          fecha_pago: string;
          id: string;
          monto: number;
          nota?: string | null;
          referencia?: string | null;
          registrado_por: string;
        };
        Update: {
          anulado?: boolean;
          anulado_en?: string | null;
          anulado_motivo?: string | null;
          anulado_por?: string | null;
          comprador_id?: string;
          comprobante_path?: string | null;
          created_at?: string;
          fecha_pago?: string;
          id?: string;
          monto?: number;
          nota?: string | null;
          referencia?: string | null;
          registrado_por?: string;
        };
        Relationships: [
          {
            foreignKeyName: "pagos_anulado_por_fkey";
            columns: ["anulado_por"];
            isOneToOne: false;
            referencedRelation: "usuarios";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "pagos_comprador_id_fkey";
            columns: ["comprador_id"];
            isOneToOne: false;
            referencedRelation: "compradores";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "pagos_comprador_id_fkey";
            columns: ["comprador_id"];
            isOneToOne: false;
            referencedRelation: "v_compradores";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "pagos_registrado_por_fkey";
            columns: ["registrado_por"];
            isOneToOne: false;
            referencedRelation: "usuarios";
            referencedColumns: ["id"];
          },
        ];
      };
      palcos: {
        Row: {
          categoria_id: string;
          columna: number;
          fila: number;
          lado: string;
          nivel: number;
          numero: number;
        };
        Insert: {
          categoria_id: string;
          columna: number;
          fila: number;
          lado: string;
          nivel: number;
          numero: number;
        };
        Update: {
          categoria_id?: string;
          columna?: number;
          fila?: number;
          lado?: string;
          nivel?: number;
          numero?: number;
        };
        Relationships: [
          {
            foreignKeyName: "palcos_categoria_id_fkey";
            columns: ["categoria_id"];
            isOneToOne: false;
            referencedRelation: "categorias";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "palcos_categoria_id_fkey";
            columns: ["categoria_id"];
            isOneToOne: false;
            referencedRelation: "v_palcos";
            referencedColumns: ["categoria_id"];
          },
          {
            foreignKeyName: "palcos_categoria_id_fkey";
            columns: ["categoria_id"];
            isOneToOne: false;
            referencedRelation: "v_resumen";
            referencedColumns: ["categoria_id"];
          },
        ];
      };
      usuarios: {
        Row: {
          color_avatar: string;
          email_login: string | null;
          id: string;
          iniciales: string;
          nombre: string;
          orden: number;
        };
        Insert: {
          color_avatar?: string;
          email_login?: string | null;
          id: string;
          iniciales: string;
          nombre: string;
          orden?: number;
        };
        Update: {
          color_avatar?: string;
          email_login?: string | null;
          id?: string;
          iniciales?: string;
          nombre?: string;
          orden?: number;
        };
        Relationships: [];
      };
      ventas: {
        Row: {
          comprador_id: string;
          estado: string;
          id: string;
          liberado_en: string | null;
          liberado_por: string | null;
          motivo_liberacion: string | null;
          palco_numero: number;
          separado_en: string;
          separado_por: string;
        };
        Insert: {
          comprador_id: string;
          estado?: string;
          id?: string;
          liberado_en?: string | null;
          liberado_por?: string | null;
          motivo_liberacion?: string | null;
          palco_numero: number;
          separado_en?: string;
          separado_por: string;
        };
        Update: {
          comprador_id?: string;
          estado?: string;
          id?: string;
          liberado_en?: string | null;
          liberado_por?: string | null;
          motivo_liberacion?: string | null;
          palco_numero?: number;
          separado_en?: string;
          separado_por?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ventas_comprador_id_fkey";
            columns: ["comprador_id"];
            isOneToOne: false;
            referencedRelation: "compradores";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ventas_comprador_id_fkey";
            columns: ["comprador_id"];
            isOneToOne: false;
            referencedRelation: "v_compradores";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ventas_liberado_por_fkey";
            columns: ["liberado_por"];
            isOneToOne: false;
            referencedRelation: "usuarios";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ventas_palco_numero_fkey";
            columns: ["palco_numero"];
            isOneToOne: false;
            referencedRelation: "palcos";
            referencedColumns: ["numero"];
          },
          {
            foreignKeyName: "ventas_palco_numero_fkey";
            columns: ["palco_numero"];
            isOneToOne: false;
            referencedRelation: "v_palcos";
            referencedColumns: ["numero"];
          },
          {
            foreignKeyName: "ventas_separado_por_fkey";
            columns: ["separado_por"];
            isOneToOne: false;
            referencedRelation: "usuarios";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      v_compradores: {
        Row: {
          apellido: string | null;
          created_at: string | null;
          documento: string | null;
          id: string | null;
          nombre: string | null;
          nombre_completo: string | null;
          palcos_activos: number | null;
          recomendado_por: string | null;
          saldo: number | null;
          telefono: string | null;
          total_abonado: number | null;
          total_precio: number | null;
          updated_at: string | null;
        };
        Relationships: [];
      };
      v_palcos: {
        Row: {
          abonado: number | null;
          categoria_id: string | null;
          categoria_nombre: string | null;
          color_hex: string | null;
          columna: number | null;
          comprador_documento: string | null;
          comprador_id: string | null;
          comprador_nombre_completo: string | null;
          estado: string | null;
          fila: number | null;
          lado: string | null;
          nivel: number | null;
          numero: number | null;
          porcentaje: number | null;
          precio: number | null;
          recomendado_por: string | null;
          saldo: number | null;
          venta_id: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "ventas_comprador_id_fkey";
            columns: ["comprador_id"];
            isOneToOne: false;
            referencedRelation: "compradores";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ventas_comprador_id_fkey";
            columns: ["comprador_id"];
            isOneToOne: false;
            referencedRelation: "v_compradores";
            referencedColumns: ["id"];
          },
        ];
      };
      v_resumen: {
        Row: {
          categoria_id: string | null;
          categoria_nombre: string | null;
          disponibles: number | null;
          pagados: number | null;
          por_cobrar: number | null;
          potencial_disponible: number | null;
          precio: number | null;
          recaudado_neto: number | null;
          separados: number | null;
          total: number | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      obtener_usuarios_login: {
        Args: Record<PropertyKey, never>;
        Returns: {
          id: string;
          nombre: string;
          iniciales: string;
          color_avatar: string;
          orden: number;
          email_login: string;
        }[];
      };
      separar_palco: {
        Args: {
          p_palco: number;
          p_comprador_id: string;
          p_abono?: Json | null;
        };
        Returns: string;
      };
      registrar_pago: {
        Args: {
          p_pago_id: string;
          p_comprador_id: string;
          p_monto: number;
          p_fecha: string;
          p_referencia: string | null;
          p_comprobante_path: string | null;
          p_nota: string | null;
          p_aplicaciones: Json;
        };
        Returns: string;
      };
      anular_pago: {
        Args: {
          p_pago_id: string;
          p_motivo: string;
        };
        Returns: undefined;
      };
      liberar_palco: {
        Args: {
          p_venta_id: string;
          p_motivo: string;
          p_devolucion_id: string;
          p_fecha_devolucion: string;
          p_referencia: string | null;
          p_comprobante_path: string | null;
        };
        Returns: undefined;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const;
