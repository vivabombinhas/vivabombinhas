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
      ai_config: {
        Row: {
          created_at: string | null
          force_show_results: boolean | null
          id: string
          max_tokens: number | null
          model: string
          system_prompt: string | null
          temperature: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          force_show_results?: boolean | null
          id?: string
          max_tokens?: number | null
          model?: string
          system_prompt?: string | null
          temperature?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          force_show_results?: boolean | null
          id?: string
          max_tokens?: number | null
          model?: string
          system_prompt?: string | null
          temperature?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      broker_notifications: {
        Row: {
          created_at: string | null
          id: string
          lead_id: string | null
          message: string
          read: boolean | null
          session_id: string | null
          title: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          lead_id?: string | null
          message: string
          read?: boolean | null
          session_id?: string | null
          title: string
        }
        Update: {
          created_at?: string | null
          id?: string
          lead_id?: string | null
          message?: string
          read?: boolean | null
          session_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "broker_notifications_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads_maria"
            referencedColumns: ["id"]
          },
        ]
      }
      config_imobiliaria: {
        Row: {
          ativo: boolean
          created_at: string
          creci: string | null
          email: string | null
          id: string
          nome: string
          updated_at: string
          whatsapp: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          creci?: string | null
          email?: string | null
          id?: string
          nome: string
          updated_at?: string
          whatsapp: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          creci?: string | null
          email?: string | null
          id?: string
          nome?: string
          updated_at?: string
          whatsapp?: string
        }
        Relationships: []
      }
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
          curador_id: string | null
          descricao: string | null
          destaque: boolean | null
          destaque_ate: string | null
          destaque_pago: boolean
          destaque_premium: boolean | null
          destaque_valor: number | null
          endereco: string | null
          estacionamento: boolean | null
          finalidade: Database["public"]["Enums"]["finalidade_imovel"]
          fotos: string[] | null
          frente_mar: boolean | null
          gestao_propria: boolean
          id: string
          imobiliaria: string | null
          iptu_anual: number | null
          last_curated_at: string | null
          link_anuncio: string | null
          mobiliado: boolean | null
          observacoes: string | null
          oculta_para_maria: boolean | null
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
          user_id: string | null
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
          curador_id?: string | null
          descricao?: string | null
          destaque?: boolean | null
          destaque_ate?: string | null
          destaque_pago?: boolean
          destaque_premium?: boolean | null
          destaque_valor?: number | null
          endereco?: string | null
          estacionamento?: boolean | null
          finalidade: Database["public"]["Enums"]["finalidade_imovel"]
          fotos?: string[] | null
          frente_mar?: boolean | null
          gestao_propria?: boolean
          id?: string
          imobiliaria?: string | null
          iptu_anual?: number | null
          last_curated_at?: string | null
          link_anuncio?: string | null
          mobiliado?: boolean | null
          observacoes?: string | null
          oculta_para_maria?: boolean | null
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
          user_id?: string | null
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
          curador_id?: string | null
          descricao?: string | null
          destaque?: boolean | null
          destaque_ate?: string | null
          destaque_pago?: boolean
          destaque_premium?: boolean | null
          destaque_valor?: number | null
          endereco?: string | null
          estacionamento?: boolean | null
          finalidade?: Database["public"]["Enums"]["finalidade_imovel"]
          fotos?: string[] | null
          frente_mar?: boolean | null
          gestao_propria?: boolean
          id?: string
          imobiliaria?: string | null
          iptu_anual?: number | null
          last_curated_at?: string | null
          link_anuncio?: string | null
          mobiliado?: boolean | null
          observacoes?: string | null
          oculta_para_maria?: boolean | null
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
          user_id?: string | null
          vagas_garagem?: number | null
          vista_mar?: boolean | null
          wifi?: boolean | null
        }
        Relationships: []
      }
      imoveis_submissions: {
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
          condominio: number | null
          created_at: string
          descricao: string | null
          endereco: string | null
          estacionamento: boolean | null
          finalidade: Database["public"]["Enums"]["finalidade_imovel"]
          fotos: string[] | null
          frente_mar: boolean | null
          gestao_propria: boolean
          id: string
          imobiliaria: string | null
          imovel_id: string | null
          iptu_anual: number | null
          link_anuncio: string | null
          mobiliado: boolean | null
          observacoes: string | null
          piscina: boolean | null
          preco: number | null
          preco_temporada_diaria: number | null
          quartos: number | null
          reviewed_at: string | null
          status_submission: Database["public"]["Enums"]["status_submission"]
          suites: number | null
          tipo: Database["public"]["Enums"]["tipo_imovel"]
          titulo: string
          updated_at: string
          user_id: string | null
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
          condominio?: number | null
          created_at?: string
          descricao?: string | null
          endereco?: string | null
          estacionamento?: boolean | null
          finalidade: Database["public"]["Enums"]["finalidade_imovel"]
          fotos?: string[] | null
          frente_mar?: boolean | null
          gestao_propria?: boolean
          id?: string
          imobiliaria?: string | null
          imovel_id?: string | null
          iptu_anual?: number | null
          link_anuncio?: string | null
          mobiliado?: boolean | null
          observacoes?: string | null
          piscina?: boolean | null
          preco?: number | null
          preco_temporada_diaria?: number | null
          quartos?: number | null
          reviewed_at?: string | null
          status_submission?: Database["public"]["Enums"]["status_submission"]
          suites?: number | null
          tipo: Database["public"]["Enums"]["tipo_imovel"]
          titulo: string
          updated_at?: string
          user_id?: string | null
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
          condominio?: number | null
          created_at?: string
          descricao?: string | null
          endereco?: string | null
          estacionamento?: boolean | null
          finalidade?: Database["public"]["Enums"]["finalidade_imovel"]
          fotos?: string[] | null
          frente_mar?: boolean | null
          gestao_propria?: boolean
          id?: string
          imobiliaria?: string | null
          imovel_id?: string | null
          iptu_anual?: number | null
          link_anuncio?: string | null
          mobiliado?: boolean | null
          observacoes?: string | null
          piscina?: boolean | null
          preco?: number | null
          preco_temporada_diaria?: number | null
          quartos?: number | null
          reviewed_at?: string | null
          status_submission?: Database["public"]["Enums"]["status_submission"]
          suites?: number | null
          tipo?: Database["public"]["Enums"]["tipo_imovel"]
          titulo?: string
          updated_at?: string
          user_id?: string | null
          vagas_garagem?: number | null
          vista_mar?: boolean | null
          wifi?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "imoveis_submissions_imovel_id_fkey"
            columns: ["imovel_id"]
            isOneToOne: false
            referencedRelation: "imoveis"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_alerts: {
        Row: {
          bairro: string | null
          created_at: string
          finalidade: string | null
          id: string
          last_matched_at: string | null
          lead_id: string
          preco_max: number | null
          quartos_min: number | null
          query_original: string | null
          status: string
          tipo: string | null
          updated_at: string
        }
        Insert: {
          bairro?: string | null
          created_at?: string
          finalidade?: string | null
          id?: string
          last_matched_at?: string | null
          lead_id: string
          preco_max?: number | null
          quartos_min?: number | null
          query_original?: string | null
          status?: string
          tipo?: string | null
          updated_at?: string
        }
        Update: {
          bairro?: string | null
          created_at?: string
          finalidade?: string | null
          id?: string
          last_matched_at?: string | null
          lead_id?: string
          preco_max?: number | null
          quartos_min?: number | null
          query_original?: string | null
          status?: string
          tipo?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      lead_conversations: {
        Row: {
          content: string
          created_at: string
          id: string
          lead_id: string
          role: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          lead_id: string
          role: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          lead_id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_conversations_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads_maria"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_matches: {
        Row: {
          created_at: string
          id: string
          imovel_id: string
          lead_id: string
          match_reasons: string[] | null
          notes: string | null
          score: number
          status: Database["public"]["Enums"]["match_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          imovel_id: string
          lead_id: string
          match_reasons?: string[] | null
          notes?: string | null
          score?: number
          status?: Database["public"]["Enums"]["match_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          imovel_id?: string
          lead_id?: string
          match_reasons?: string[] | null
          notes?: string | null
          score?: number
          status?: Database["public"]["Enums"]["match_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_matches_imovel_id_fkey"
            columns: ["imovel_id"]
            isOneToOne: false
            referencedRelation: "imoveis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_matches_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads_maria"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_notes: {
        Row: {
          content: string
          created_at: string
          id: string
          lead_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          lead_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          lead_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_notes_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads_maria"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_revenue: {
        Row: {
          comissao_percentual: number | null
          created_at: string
          data_fechamento: string | null
          data_pagamento: string | null
          id: string
          imovel_id: string | null
          lead_id: string
          observacoes: string | null
          parceiro_nome: string | null
          parceiro_telefone: string | null
          status: string
          tipo_negocio: string
          updated_at: string
          valor_negocio: number | null
          valor_pago: number | null
          valor_previsto: number | null
        }
        Insert: {
          comissao_percentual?: number | null
          created_at?: string
          data_fechamento?: string | null
          data_pagamento?: string | null
          id?: string
          imovel_id?: string | null
          lead_id: string
          observacoes?: string | null
          parceiro_nome?: string | null
          parceiro_telefone?: string | null
          status?: string
          tipo_negocio: string
          updated_at?: string
          valor_negocio?: number | null
          valor_pago?: number | null
          valor_previsto?: number | null
        }
        Update: {
          comissao_percentual?: number | null
          created_at?: string
          data_fechamento?: string | null
          data_pagamento?: string | null
          id?: string
          imovel_id?: string | null
          lead_id?: string
          observacoes?: string | null
          parceiro_nome?: string | null
          parceiro_telefone?: string | null
          status?: string
          tipo_negocio?: string
          updated_at?: string
          valor_negocio?: number | null
          valor_pago?: number | null
          valor_previsto?: number | null
        }
        Relationships: []
      }
      leads_maria: {
        Row: {
          bairro_interesse: string | null
          bens_para_permuta: string | null
          capital_disponivel: number | null
          chat_history: Json | null
          cidade_estado: string | null
          created_at: string
          email: string | null
          faixa_preco: string | null
          feedback_corretor: string | null
          id: string
          interesse: string | null
          last_contact_at: string | null
          lead_score: string | null
          mensagem_original: string | null
          next_followup_at: string | null
          nome: string | null
          objetivo: string | null
          objetivo_investimento: string | null
          observacao_interna: string | null
          orcamento_max: number | null
          orcamento_min: number | null
          origem: string
          pais_codigo: string | null
          prazo_compra: string | null
          proximo_passo_sugerido: string | null
          quer_analise: boolean | null
          região_interesse: string | null
          resumo_ia: string | null
          session_id: string | null
          status: Database["public"]["Enums"]["status_lead"]
          telefone: string | null
          tipo_imovel: string | null
          tipo_lead: string | null
        }
        Insert: {
          bairro_interesse?: string | null
          bens_para_permuta?: string | null
          capital_disponivel?: number | null
          chat_history?: Json | null
          cidade_estado?: string | null
          created_at?: string
          email?: string | null
          faixa_preco?: string | null
          feedback_corretor?: string | null
          id?: string
          interesse?: string | null
          last_contact_at?: string | null
          lead_score?: string | null
          mensagem_original?: string | null
          next_followup_at?: string | null
          nome?: string | null
          objetivo?: string | null
          objetivo_investimento?: string | null
          observacao_interna?: string | null
          orcamento_max?: number | null
          orcamento_min?: number | null
          origem?: string
          pais_codigo?: string | null
          prazo_compra?: string | null
          proximo_passo_sugerido?: string | null
          quer_analise?: boolean | null
          região_interesse?: string | null
          resumo_ia?: string | null
          session_id?: string | null
          status?: Database["public"]["Enums"]["status_lead"]
          telefone?: string | null
          tipo_imovel?: string | null
          tipo_lead?: string | null
        }
        Update: {
          bairro_interesse?: string | null
          bens_para_permuta?: string | null
          capital_disponivel?: number | null
          chat_history?: Json | null
          cidade_estado?: string | null
          created_at?: string
          email?: string | null
          faixa_preco?: string | null
          feedback_corretor?: string | null
          id?: string
          interesse?: string | null
          last_contact_at?: string | null
          lead_score?: string | null
          mensagem_original?: string | null
          next_followup_at?: string | null
          nome?: string | null
          objetivo?: string | null
          objetivo_investimento?: string | null
          observacao_interna?: string | null
          orcamento_max?: number | null
          orcamento_min?: number | null
          origem?: string
          pais_codigo?: string | null
          prazo_compra?: string | null
          proximo_passo_sugerido?: string | null
          quer_analise?: boolean | null
          região_interesse?: string | null
          resumo_ia?: string | null
          session_id?: string | null
          status?: Database["public"]["Enums"]["status_lead"]
          telefone?: string | null
          tipo_imovel?: string | null
          tipo_lead?: string | null
        }
        Relationships: []
      }
      maria_messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          lead_id: string | null
          role: string
          session_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          lead_id?: string | null
          role: string
          session_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          lead_id?: string | null
          role?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "maria_messages_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads_maria"
            referencedColumns: ["id"]
          },
        ]
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
      find_matching_leads: {
        Args: { _imovel_id: string }
        Returns: {
          lead_id: string
          reasons: string[]
          score: number
        }[]
      }
      get_qualified_leads_stats: {
        Args: never
        Returns: {
          total: number
          unread: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      parse_faixa_preco: { Args: { faixa: string }; Returns: number[] }
    }
    Enums: {
      app_role: "admin" | "user"
      finalidade_imovel: "compra" | "aluguel_anual" | "temporada"
      match_status: "pending" | "sent" | "converted" | "dismissed"
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
      status_lead:
        | "novo"
        | "contatado"
        | "convertido"
        | "descartado"
        | "anonimo"
      status_submission: "pendente" | "aprovado" | "rejeitado"
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
      match_status: ["pending", "sent", "converted", "dismissed"],
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
      status_lead: ["novo", "contatado", "convertido", "descartado", "anonimo"],
      status_submission: ["pendente", "aprovado", "rejeitado"],
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
