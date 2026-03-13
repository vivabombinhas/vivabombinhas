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
      imoveis: {
        Row: {
          aceita_pet: boolean | null
          anunciante_email: string | null
          anunciante_nome: string | null
          anunciante_telefone: string | null
          ar_condicionado: boolean | null
          area_m2: number | null
          bairro: string | null
          banheiros: number | null
          capacidade_pessoas: number | null
          churrasqueira: boolean | null
          cidade: string
          codigo: string | null
          condominio: number | null
          created_at: string
          descricao: string | null
          destaque: boolean | null
          endereco: string | null
          estacionamento: boolean | null
          finalidade: Database["public"]["Enums"]["finalidade_imovel"]
          fotos: string[] | null
          frente_mar: boolean | null
          id: string
          imobiliaria: string | null
          iptu_anual: number | null
          link_anuncio: string | null
          mobiliado: boolean | null
          observacoes: string | null
          origem: Database["public"]["Enums"]["origem_anuncio"] | null
          piscina: boolean | null
          preco: number | null
          preco_temporada_diaria: number | null
          quartos: number | null
          status: Database["public"]["Enums"]["status_imovel"]
          suites: number | null
          tipo: Database["public"]["Enums"]["tipo_imovel"]
          titulo: string
          updated_at: string
          vagas_garagem: number | null
          vista_mar: boolean | null
          wifi: boolean | null
        }
        Insert: {
          aceita_pet?: boolean | null
          anunciante_email?: string | null
          anunciante_nome?: string | null
          anunciante_telefone?: string | null
          ar_condicionado?: boolean | null
          area_m2?: number | null
          bairro?: string | null
          banheiros?: number | null
          capacidade_pessoas?: number | null
          churrasqueira?: boolean | null
          cidade?: string
          codigo?: string | null
          condominio?: number | null
          created_at?: string
          descricao?: string | null
          destaque?: boolean | null
          endereco?: string | null
          estacionamento?: boolean | null
          finalidade: Database["public"]["Enums"]["finalidade_imovel"]
          fotos?: string[] | null
          frente_mar?: boolean | null
          id?: string
          imobiliaria?: string | null
          iptu_anual?: number | null
          link_anuncio?: string | null
          mobiliado?: boolean | null
          observacoes?: string | null
          origem?: Database["public"]["Enums"]["origem_anuncio"] | null
          piscina?: boolean | null
          preco?: number | null
          preco_temporada_diaria?: number | null
          quartos?: number | null
          status?: Database["public"]["Enums"]["status_imovel"]
          suites?: number | null
          tipo: Database["public"]["Enums"]["tipo_imovel"]
          titulo: string
          updated_at?: string
          vagas_garagem?: number | null
          vista_mar?: boolean | null
          wifi?: boolean | null
        }
        Update: {
          aceita_pet?: boolean | null
          anunciante_email?: string | null
          anunciante_nome?: string | null
          anunciante_telefone?: string | null
          ar_condicionado?: boolean | null
          area_m2?: number | null
          bairro?: string | null
          banheiros?: number | null
          capacidade_pessoas?: number | null
          churrasqueira?: boolean | null
          cidade?: string
          codigo?: string | null
          condominio?: number | null
          created_at?: string
          descricao?: string | null
          destaque?: boolean | null
          endereco?: string | null
          estacionamento?: boolean | null
          finalidade?: Database["public"]["Enums"]["finalidade_imovel"]
          fotos?: string[] | null
          frente_mar?: boolean | null
          id?: string
          imobiliaria?: string | null
          iptu_anual?: number | null
          link_anuncio?: string | null
          mobiliado?: boolean | null
          observacoes?: string | null
          origem?: Database["public"]["Enums"]["origem_anuncio"] | null
          piscina?: boolean | null
          preco?: number | null
          preco_temporada_diaria?: number | null
          quartos?: number | null
          status?: Database["public"]["Enums"]["status_imovel"]
          suites?: number | null
          tipo?: Database["public"]["Enums"]["tipo_imovel"]
          titulo?: string
          updated_at?: string
          vagas_garagem?: number | null
          vista_mar?: boolean | null
          wifi?: boolean | null
        }
        Relationships: []
      }
      leads_maria: {
        Row: {
          bairro_interesse: string | null
          created_at: string
          email: string | null
          faixa_preco: string | null
          id: string
          interesse: string | null
          mensagem_original: string | null
          nome: string
          origem: string
          status: Database["public"]["Enums"]["status_lead"]
          telefone: string
          tipo_imovel: string | null
        }
        Insert: {
          bairro_interesse?: string | null
          created_at?: string
          email?: string | null
          faixa_preco?: string | null
          id?: string
          interesse?: string | null
          mensagem_original?: string | null
          nome: string
          origem?: string
          status?: Database["public"]["Enums"]["status_lead"]
          telefone: string
          tipo_imovel?: string | null
        }
        Update: {
          bairro_interesse?: string | null
          created_at?: string
          email?: string | null
          faixa_preco?: string | null
          id?: string
          interesse?: string | null
          mensagem_original?: string | null
          nome?: string
          origem?: string
          status?: Database["public"]["Enums"]["status_lead"]
          telefone?: string
          tipo_imovel?: string | null
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
    }
    Enums: {
      app_role: "admin" | "user"
      finalidade_imovel: "compra" | "aluguel_anual" | "temporada"
      origem_anuncio:
        | "manual"
        | "olx"
        | "zap_imoveis"
        | "imovel_web"
        | "viva_real"
        | "airbnb"
        | "booking"
        | "imobiliaria"
        | "whatsapp"
        | "outro"
      status_imovel: "ativo" | "pausado" | "removido"
      status_lead: "novo" | "contatado" | "convertido" | "descartado"
      tipo_imovel:
        | "apartamento"
        | "casa"
        | "cobertura"
        | "terreno"
        | "sobrado"
        | "studio"
        | "pousada"
        | "sala_comercial"
        | "outro"
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
      finalidade_imovel: ["compra", "aluguel_anual", "temporada"],
      origem_anuncio: [
        "manual",
        "olx",
        "zap_imoveis",
        "imovel_web",
        "viva_real",
        "airbnb",
        "booking",
        "imobiliaria",
        "whatsapp",
        "outro",
      ],
      status_imovel: ["ativo", "pausado", "removido"],
      status_lead: ["novo", "contatado", "convertido", "descartado"],
      tipo_imovel: [
        "apartamento",
        "casa",
        "cobertura",
        "terreno",
        "sobrado",
        "studio",
        "pousada",
        "sala_comercial",
        "outro",
      ],
    },
  },
} as const
