export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      admin_audit_log: {
        Row: {
          action: string;
          admin_id: string | null;
          created_at: string;
          diff: Json | null;
          entity: string;
          entity_id: string | null;
          id: string;
        };
        ComputedFields: never;
        Insert: {
          action: string;
          admin_id?: string | null;
          created_at?: string;
          diff?: Json | null;
          entity: string;
          entity_id?: string | null;
          id?: string;
        };
        Update: {
          action?: string;
          admin_id?: string | null;
          created_at?: string;
          diff?: Json | null;
          entity?: string;
          entity_id?: string | null;
          id?: string;
        };
        Relationships: [];
      };
      app_settings: {
        Row: {
          created_at: string;
          description: string | null;
          key: string;
          updated_at: string;
          value: NonNullable<Json>;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          description?: string | null;
          key: string;
          updated_at?: string;
          value: NonNullable<Json>;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          key?: string;
          updated_at?: string;
          value?: NonNullable<Json>;
        };
        Relationships: [];
      };
      attendance_entries: {
        Row: {
          attendance_subject_id: string;
          attended: boolean;
          created_at: string;
          date: string;
          id: string;
          updated_at: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          attendance_subject_id: string;
          attended: boolean;
          created_at?: string;
          date: string;
          id?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          attendance_subject_id?: string;
          attended?: boolean;
          created_at?: string;
          date?: string;
          id?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "attendance_entries_attendance_subject_id_fkey";
            columns: ["attendance_subject_id"];
            isOneToOne: false;
            referencedRelation: "attendance_subjects";
            referencedColumns: ["id"];
          },
        ];
      };
      attendance_subjects: {
        Row: {
          academic_year: string;
          baseline_attended: number;
          baseline_total: number;
          created_at: string;
          id: string;
          label: string;
          semester: number;
          subject_id: string | null;
          updated_at: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          academic_year: string;
          baseline_attended?: number;
          baseline_total?: number;
          created_at?: string;
          id?: string;
          label: string;
          semester: number;
          subject_id?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          academic_year?: string;
          baseline_attended?: number;
          baseline_total?: number;
          created_at?: string;
          id?: string;
          label?: string;
          semester?: number;
          subject_id?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "attendance_subjects_subject_id_fkey";
            columns: ["subject_id"];
            isOneToOne: false;
            referencedRelation: "subjects";
            referencedColumns: ["id"];
          },
        ];
      };
      bookmarks: {
        Row: {
          created_at: string;
          id: string;
          item_id: string;
          item_type: Database["public"]["Enums"]["content_item_type"];
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          id?: string;
          item_id: string;
          item_type: Database["public"]["Enums"]["content_item_type"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          item_id?: string;
          item_type?: Database["public"]["Enums"]["content_item_type"];
          user_id?: string;
        };
        Relationships: [];
      };
      branches: {
        Row: {
          code: string;
          college_id: string;
          created_at: string;
          id: string;
          name: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          code: string;
          college_id: string;
          created_at?: string;
          id?: string;
          name: string;
          updated_at?: string;
        };
        Update: {
          code?: string;
          college_id?: string;
          created_at?: string;
          id?: string;
          name?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "branches_college_id_fkey";
            columns: ["college_id"];
            isOneToOne: false;
            referencedRelation: "colleges";
            referencedColumns: ["id"];
          },
        ];
      };
      colleges: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          short_code: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          short_code: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          short_code?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      content_reports: {
        Row: {
          created_at: string;
          id: string;
          item_id: string;
          item_type: Database["public"]["Enums"]["content_item_type"];
          message: string | null;
          reason: Database["public"]["Enums"]["report_reason"];
          resolved_at: string | null;
          resolved_by: string | null;
          status: Database["public"]["Enums"]["report_status"];
          updated_at: string;
          user_id: string | null;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          id?: string;
          item_id: string;
          item_type: Database["public"]["Enums"]["content_item_type"];
          message?: string | null;
          reason: Database["public"]["Enums"]["report_reason"];
          resolved_at?: string | null;
          resolved_by?: string | null;
          status?: Database["public"]["Enums"]["report_status"];
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          item_id?: string;
          item_type?: Database["public"]["Enums"]["content_item_type"];
          message?: string | null;
          reason?: Database["public"]["Enums"]["report_reason"];
          resolved_at?: string | null;
          resolved_by?: string | null;
          status?: Database["public"]["Enums"]["report_status"];
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
      devices: {
        Row: {
          created_at: string;
          device_id: string;
          id: string;
          label: string | null;
          last_seen_at: string;
          platform: Database["public"]["Enums"]["device_platform"];
          revoked_at: string | null;
          updated_at: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          device_id: string;
          id?: string;
          label?: string | null;
          last_seen_at?: string;
          platform: Database["public"]["Enums"]["device_platform"];
          revoked_at?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          device_id?: string;
          id?: string;
          label?: string | null;
          last_seen_at?: string;
          platform?: Database["public"]["Enums"]["device_platform"];
          revoked_at?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      documents: {
        Row: {
          content_md: string;
          created_at: string;
          id: string;
          is_published: boolean;
          kind: Database["public"]["Enums"]["document_kind"];
          module_id: string;
          pdf_path: string | null;
          title: string;
          updated_at: string;
          version: number;
        };
        ComputedFields: never;
        Insert: {
          content_md?: string;
          created_at?: string;
          id?: string;
          is_published?: boolean;
          kind: Database["public"]["Enums"]["document_kind"];
          module_id: string;
          pdf_path?: string | null;
          title: string;
          updated_at?: string;
          version?: number;
        };
        Update: {
          content_md?: string;
          created_at?: string;
          id?: string;
          is_published?: boolean;
          kind?: Database["public"]["Enums"]["document_kind"];
          module_id?: string;
          pdf_path?: string | null;
          title?: string;
          updated_at?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "documents_module_id_fkey";
            columns: ["module_id"];
            isOneToOne: false;
            referencedRelation: "modules";
            referencedColumns: ["id"];
          },
        ];
      };
      experiments: {
        Row: {
          aim_md: string;
          code_md: string;
          conclusion_md: string;
          created_at: string;
          id: string;
          is_published: boolean;
          number: number;
          output_md: string;
          sort_order: number;
          subject_id: string;
          theory_md: string;
          title: string;
          updated_at: string;
          version: number;
          viva: NonNullable<Json>;
        };
        ComputedFields: never;
        Insert: {
          aim_md?: string;
          code_md?: string;
          conclusion_md?: string;
          created_at?: string;
          id?: string;
          is_published?: boolean;
          number: number;
          output_md?: string;
          sort_order?: number;
          subject_id: string;
          theory_md?: string;
          title: string;
          updated_at?: string;
          version?: number;
          viva?: NonNullable<Json>;
        };
        Update: {
          aim_md?: string;
          code_md?: string;
          conclusion_md?: string;
          created_at?: string;
          id?: string;
          is_published?: boolean;
          number?: number;
          output_md?: string;
          sort_order?: number;
          subject_id?: string;
          theory_md?: string;
          title?: string;
          updated_at?: string;
          version?: number;
          viva?: NonNullable<Json>;
        };
        Relationships: [
          {
            foreignKeyName: "experiments_subject_id_fkey";
            columns: ["subject_id"];
            isOneToOne: false;
            referencedRelation: "subjects";
            referencedColumns: ["id"];
          },
        ];
      };
      formula_cards: {
        Row: {
          created_at: string;
          formula_latex: string;
          id: string;
          is_published: boolean;
          module_id: string;
          sort_order: number;
          symbols: NonNullable<Json>;
          title: string;
          updated_at: string;
          version: number;
          when_to_use: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          formula_latex: string;
          id?: string;
          is_published?: boolean;
          module_id: string;
          sort_order?: number;
          symbols?: NonNullable<Json>;
          title: string;
          updated_at?: string;
          version?: number;
          when_to_use?: string;
        };
        Update: {
          created_at?: string;
          formula_latex?: string;
          id?: string;
          is_published?: boolean;
          module_id?: string;
          sort_order?: number;
          symbols?: NonNullable<Json>;
          title?: string;
          updated_at?: string;
          version?: number;
          when_to_use?: string;
        };
        Relationships: [
          {
            foreignKeyName: "formula_cards_module_id_fkey";
            columns: ["module_id"];
            isOneToOne: false;
            referencedRelation: "modules";
            referencedColumns: ["id"];
          },
        ];
      };
      module_completion: {
        Row: {
          created_at: string;
          module_id: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          module_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          module_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "module_completion_module_id_fkey";
            columns: ["module_id"];
            isOneToOne: false;
            referencedRelation: "modules";
            referencedColumns: ["id"];
          },
        ];
      };
      modules: {
        Row: {
          created_at: string;
          id: string;
          is_free_preview: boolean;
          is_published: boolean;
          number: number;
          sort_order: number;
          subject_id: string;
          title: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          id?: string;
          is_free_preview: boolean;
          is_published?: boolean;
          number: number;
          sort_order?: number;
          subject_id: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_free_preview?: boolean;
          is_published?: boolean;
          number?: number;
          sort_order?: number;
          subject_id?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "modules_subject_id_fkey";
            columns: ["subject_id"];
            isOneToOne: false;
            referencedRelation: "subjects";
            referencedColumns: ["id"];
          },
        ];
      };
      payments: {
        Row: {
          amount_paise: number;
          created_at: string;
          currency: string;
          id: string;
          method: string | null;
          paid_at: string | null;
          provider: string;
          provider_payment_id: string;
          purchase_id: string | null;
          status: Database["public"]["Enums"]["payment_status"];
          subscription_id: string | null;
          updated_at: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          amount_paise: number;
          created_at?: string;
          currency?: string;
          id?: string;
          method?: string | null;
          paid_at?: string | null;
          provider?: string;
          provider_payment_id: string;
          purchase_id?: string | null;
          status: Database["public"]["Enums"]["payment_status"];
          subscription_id?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          amount_paise?: number;
          created_at?: string;
          currency?: string;
          id?: string;
          method?: string | null;
          paid_at?: string | null;
          provider?: string;
          provider_payment_id?: string;
          purchase_id?: string | null;
          status?: Database["public"]["Enums"]["payment_status"];
          subscription_id?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "payments_purchase_id_fkey";
            columns: ["purchase_id"];
            isOneToOne: false;
            referencedRelation: "purchases";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "payments_subscription_id_fkey";
            columns: ["subscription_id"];
            isOneToOne: false;
            referencedRelation: "subscriptions";
            referencedColumns: ["id"];
          },
        ];
      };
      plans: {
        Row: {
          created_at: string;
          currency: string;
          description: string | null;
          id: string;
          interval: Database["public"]["Enums"]["plan_interval"];
          is_active: boolean;
          name: string;
          price_paise: number;
          razorpay_plan_id: string | null;
          scope: Database["public"]["Enums"]["plan_scope"];
          sort_order: number;
          updated_at: string;
          validity_days: number | null;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          currency?: string;
          description?: string | null;
          id?: string;
          interval: Database["public"]["Enums"]["plan_interval"];
          is_active?: boolean;
          name: string;
          price_paise: number;
          razorpay_plan_id?: string | null;
          scope?: Database["public"]["Enums"]["plan_scope"];
          sort_order?: number;
          updated_at?: string;
          validity_days?: number | null;
        };
        Update: {
          created_at?: string;
          currency?: string;
          description?: string | null;
          id?: string;
          interval?: Database["public"]["Enums"]["plan_interval"];
          is_active?: boolean;
          name?: string;
          price_paise?: number;
          razorpay_plan_id?: string | null;
          scope?: Database["public"]["Enums"]["plan_scope"];
          sort_order?: number;
          updated_at?: string;
          validity_days?: number | null;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          active_session_id: string | null;
          age_confirmed_at: string | null;
          branch_id: string | null;
          college_id: string | null;
          comp_access_until: string | null;
          consent_accepted_at: string | null;
          created_at: string;
          email: string | null;
          full_name: string | null;
          id: string;
          onboarded_at: string | null;
          role: Database["public"]["Enums"]["user_role"];
          semester: number | null;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          active_session_id?: string | null;
          age_confirmed_at?: string | null;
          branch_id?: string | null;
          college_id?: string | null;
          comp_access_until?: string | null;
          consent_accepted_at?: string | null;
          created_at?: string;
          email?: string | null;
          full_name?: string | null;
          id: string;
          onboarded_at?: string | null;
          role?: Database["public"]["Enums"]["user_role"];
          semester?: number | null;
          updated_at?: string;
        };
        Update: {
          active_session_id?: string | null;
          age_confirmed_at?: string | null;
          branch_id?: string | null;
          college_id?: string | null;
          comp_access_until?: string | null;
          consent_accepted_at?: string | null;
          created_at?: string;
          email?: string | null;
          full_name?: string | null;
          id?: string;
          onboarded_at?: string | null;
          role?: Database["public"]["Enums"]["user_role"];
          semester?: number | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_branch_id_fkey";
            columns: ["branch_id"];
            isOneToOne: false;
            referencedRelation: "branches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "profiles_college_id_fkey";
            columns: ["college_id"];
            isOneToOne: false;
            referencedRelation: "colleges";
            referencedColumns: ["id"];
          },
        ];
      };
      purchases: {
        Row: {
          created_at: string;
          id: string;
          plan_id: string;
          provider_order_id: string | null;
          scope: Database["public"]["Enums"]["plan_scope"];
          semester: number | null;
          subject_id: string | null;
          syllabus_version_id: string | null;
          updated_at: string;
          user_id: string;
          valid_until: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          id?: string;
          plan_id: string;
          provider_order_id?: string | null;
          scope: Database["public"]["Enums"]["plan_scope"];
          semester?: number | null;
          subject_id?: string | null;
          syllabus_version_id?: string | null;
          updated_at?: string;
          user_id: string;
          valid_until: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          plan_id?: string;
          provider_order_id?: string | null;
          scope?: Database["public"]["Enums"]["plan_scope"];
          semester?: number | null;
          subject_id?: string | null;
          syllabus_version_id?: string | null;
          updated_at?: string;
          user_id?: string;
          valid_until?: string;
        };
        Relationships: [
          {
            foreignKeyName: "purchases_plan_id_fkey";
            columns: ["plan_id"];
            isOneToOne: false;
            referencedRelation: "plans";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "purchases_subject_id_fkey";
            columns: ["subject_id"];
            isOneToOne: false;
            referencedRelation: "subjects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "purchases_syllabus_version_id_fkey";
            columns: ["syllabus_version_id"];
            isOneToOne: false;
            referencedRelation: "syllabus_versions";
            referencedColumns: ["id"];
          },
        ];
      };
      questions: {
        Row: {
          answer_md: string;
          created_at: string;
          frequency: Database["public"]["Enums"]["question_frequency"] | null;
          id: string;
          is_published: boolean;
          kind: Database["public"]["Enums"]["question_kind"];
          marks: number | null;
          module_id: string | null;
          question_md: string;
          sessions: string[];
          sort_order: number;
          subject_id: string;
          updated_at: string;
          version: number;
        };
        ComputedFields: never;
        Insert: {
          answer_md?: string;
          created_at?: string;
          frequency?: Database["public"]["Enums"]["question_frequency"] | null;
          id?: string;
          is_published?: boolean;
          kind: Database["public"]["Enums"]["question_kind"];
          marks?: number | null;
          module_id?: string | null;
          question_md: string;
          sessions?: string[];
          sort_order?: number;
          subject_id: string;
          updated_at?: string;
          version?: number;
        };
        Update: {
          answer_md?: string;
          created_at?: string;
          frequency?: Database["public"]["Enums"]["question_frequency"] | null;
          id?: string;
          is_published?: boolean;
          kind?: Database["public"]["Enums"]["question_kind"];
          marks?: number | null;
          module_id?: string | null;
          question_md?: string;
          sessions?: string[];
          sort_order?: number;
          subject_id?: string;
          updated_at?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "questions_module_id_fkey";
            columns: ["module_id"];
            isOneToOne: false;
            referencedRelation: "modules";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "questions_subject_id_fkey";
            columns: ["subject_id"];
            isOneToOne: false;
            referencedRelation: "subjects";
            referencedColumns: ["id"];
          },
        ];
      };
      subjects: {
        Row: {
          code: string;
          created_at: string;
          description: string | null;
          id: string;
          is_published: boolean;
          name: string;
          semester: number;
          sort_order: number;
          syllabus_version_id: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          code: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          is_published?: boolean;
          name: string;
          semester: number;
          sort_order?: number;
          syllabus_version_id: string;
          updated_at?: string;
        };
        Update: {
          code?: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          is_published?: boolean;
          name?: string;
          semester?: number;
          sort_order?: number;
          syllabus_version_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "subjects_syllabus_version_id_fkey";
            columns: ["syllabus_version_id"];
            isOneToOne: false;
            referencedRelation: "syllabus_versions";
            referencedColumns: ["id"];
          },
        ];
      };
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean;
          created_at: string;
          current_period_end: string | null;
          current_period_start: string | null;
          grace_until: string | null;
          id: string;
          plan_id: string;
          provider: string;
          provider_subscription_id: string | null;
          status: Database["public"]["Enums"]["subscription_status"];
          updated_at: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          cancel_at_period_end?: boolean;
          created_at?: string;
          current_period_end?: string | null;
          current_period_start?: string | null;
          grace_until?: string | null;
          id?: string;
          plan_id: string;
          provider?: string;
          provider_subscription_id?: string | null;
          status?: Database["public"]["Enums"]["subscription_status"];
          updated_at?: string;
          user_id: string;
        };
        Update: {
          cancel_at_period_end?: boolean;
          created_at?: string;
          current_period_end?: string | null;
          current_period_start?: string | null;
          grace_until?: string | null;
          id?: string;
          plan_id?: string;
          provider?: string;
          provider_subscription_id?: string | null;
          status?: Database["public"]["Enums"]["subscription_status"];
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_id_fkey";
            columns: ["plan_id"];
            isOneToOne: false;
            referencedRelation: "plans";
            referencedColumns: ["id"];
          },
        ];
      };
      syllabus_versions: {
        Row: {
          branch_id: string;
          created_at: string;
          id: string;
          is_current: boolean;
          label: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          branch_id: string;
          created_at?: string;
          id?: string;
          is_current?: boolean;
          label: string;
          updated_at?: string;
        };
        Update: {
          branch_id?: string;
          created_at?: string;
          id?: string;
          is_current?: boolean;
          label?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "syllabus_versions_branch_id_fkey";
            columns: ["branch_id"];
            isOneToOne: false;
            referencedRelation: "branches";
            referencedColumns: ["id"];
          },
        ];
      };
      topic_progress: {
        Row: {
          created_at: string;
          status: Database["public"]["Enums"]["topic_status"];
          topic_id: string;
          updated_at: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          status?: Database["public"]["Enums"]["topic_status"];
          topic_id: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          status?: Database["public"]["Enums"]["topic_status"];
          topic_id?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "topic_progress_topic_id_fkey";
            columns: ["topic_id"];
            isOneToOne: false;
            referencedRelation: "topics";
            referencedColumns: ["id"];
          },
        ];
      };
      topics: {
        Row: {
          created_at: string;
          id: string;
          module_id: string;
          sort_order: number;
          title: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          id?: string;
          module_id: string;
          sort_order?: number;
          title: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          module_id?: string;
          sort_order?: number;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "topics_module_id_fkey";
            columns: ["module_id"];
            isOneToOne: false;
            referencedRelation: "modules";
            referencedColumns: ["id"];
          },
        ];
      };
      videos: {
        Row: {
          captions_url: string | null;
          chapters: NonNullable<Json>;
          created_at: string;
          duration_sec: number | null;
          id: string;
          is_published: boolean;
          module_id: string;
          processing_status: Database["public"]["Enums"]["video_processing_status"];
          provider: Database["public"]["Enums"]["video_provider"];
          provider_video_id: string | null;
          sort_order: number;
          thumbnail_url: string | null;
          title: string;
          transcript_md: string | null;
          updated_at: string;
          version: number;
        };
        ComputedFields: never;
        Insert: {
          captions_url?: string | null;
          chapters?: NonNullable<Json>;
          created_at?: string;
          duration_sec?: number | null;
          id?: string;
          is_published?: boolean;
          module_id: string;
          processing_status?: Database["public"]["Enums"]["video_processing_status"];
          provider: Database["public"]["Enums"]["video_provider"];
          provider_video_id?: string | null;
          sort_order?: number;
          thumbnail_url?: string | null;
          title: string;
          transcript_md?: string | null;
          updated_at?: string;
          version?: number;
        };
        Update: {
          captions_url?: string | null;
          chapters?: NonNullable<Json>;
          created_at?: string;
          duration_sec?: number | null;
          id?: string;
          is_published?: boolean;
          module_id?: string;
          processing_status?: Database["public"]["Enums"]["video_processing_status"];
          provider?: Database["public"]["Enums"]["video_provider"];
          provider_video_id?: string | null;
          sort_order?: number;
          thumbnail_url?: string | null;
          title?: string;
          transcript_md?: string | null;
          updated_at?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "videos_module_id_fkey";
            columns: ["module_id"];
            isOneToOne: false;
            referencedRelation: "modules";
            referencedColumns: ["id"];
          },
        ];
      };
      watch_progress: {
        Row: {
          completed: boolean;
          created_at: string;
          position_sec: number;
          updated_at: string;
          user_id: string;
          video_id: string;
        };
        ComputedFields: never;
        Insert: {
          completed?: boolean;
          created_at?: string;
          position_sec?: number;
          updated_at?: string;
          user_id: string;
          video_id: string;
        };
        Update: {
          completed?: boolean;
          created_at?: string;
          position_sec?: number;
          updated_at?: string;
          user_id?: string;
          video_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "watch_progress_video_id_fkey";
            columns: ["video_id"];
            isOneToOne: false;
            referencedRelation: "videos";
            referencedColumns: ["id"];
          },
        ];
      };
      webhook_events: {
        Row: {
          created_at: string;
          error: string | null;
          event_id: string;
          id: string;
          payload: NonNullable<Json>;
          processed_at: string | null;
          provider: string;
          received_at: string;
          type: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          error?: string | null;
          event_id: string;
          id?: string;
          payload: NonNullable<Json>;
          processed_at?: string | null;
          provider: string;
          received_at?: string;
          type: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          error?: string | null;
          event_id?: string;
          id?: string;
          payload?: NonNullable<Json>;
          processed_at?: string | null;
          provider?: string;
          received_at?: string;
          type?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      can_inspect_user: { Args: { p_user: string }; Returns: boolean };
      has_access: { Args: { p_module: string; p_user: string }; Returns: boolean };
      has_subject_access: { Args: { p_subject: string; p_user: string }; Returns: boolean };
      is_admin: { Args: { p_user?: string }; Returns: boolean };
      module_content_counts: {
        Args: { p_subject: string };
        Returns: {
          formula_cards: number;
          has_formula_sheet: boolean;
          has_important_sheet: boolean;
          has_pyq_sheet: boolean;
          has_short_notes: boolean;
          has_viva_sheet: boolean;
          important_questions: number;
          module_id: string;
          pyqs: number;
          videos: number;
          viva_questions: number;
        }[];
      };
      module_visible: { Args: { p_module: string }; Returns: boolean };
      reorder_items: { Args: { p_ids: string[]; p_table: string }; Returns: undefined };
      setting: { Args: { p_key: string }; Returns: Json };
      subject_visible: { Args: { p_subject: string }; Returns: boolean };
    };
    Enums: {
      content_item_type:
        "module" | "video" | "document" | "formula_card" | "question" | "experiment";
      device_platform: "web" | "android" | "ios";
      document_kind:
        | "short_notes"
        | "formula_sheet"
        | "practical"
        | "pyq_sheet"
        | "important_sheet"
        | "viva_sheet";
      payment_status: "created" | "authorized" | "captured" | "failed" | "refunded";
      plan_interval: "month" | "one_time";
      plan_scope: "all" | "subject" | "semester";
      question_frequency: "very_frequent" | "frequent" | "sometimes";
      question_kind: "pyq" | "important" | "viva";
      report_reason: "wrong_content" | "typo" | "unclear" | "broken_media" | "other";
      report_status: "open" | "in_progress" | "resolved" | "dismissed";
      subscription_status:
        "created" | "active" | "pending" | "halted" | "cancelled" | "completed" | "expired";
      topic_status: "todo" | "doing" | "done";
      user_role: "student" | "contributor" | "admin";
      video_processing_status: "pending" | "uploading" | "processing" | "ready" | "failed";
      video_provider: "vdocipher" | "bunny" | "dev";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

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
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      content_item_type: ["module", "video", "document", "formula_card", "question", "experiment"],
      device_platform: ["web", "android", "ios"],
      document_kind: [
        "short_notes",
        "formula_sheet",
        "practical",
        "pyq_sheet",
        "important_sheet",
        "viva_sheet",
      ],
      payment_status: ["created", "authorized", "captured", "failed", "refunded"],
      plan_interval: ["month", "one_time"],
      plan_scope: ["all", "subject", "semester"],
      question_frequency: ["very_frequent", "frequent", "sometimes"],
      question_kind: ["pyq", "important", "viva"],
      report_reason: ["wrong_content", "typo", "unclear", "broken_media", "other"],
      report_status: ["open", "in_progress", "resolved", "dismissed"],
      subscription_status: [
        "created",
        "active",
        "pending",
        "halted",
        "cancelled",
        "completed",
        "expired",
      ],
      topic_status: ["todo", "doing", "done"],
      user_role: ["student", "contributor", "admin"],
      video_processing_status: ["pending", "uploading", "processing", "ready", "failed"],
      video_provider: ["vdocipher", "bunny", "dev"],
    },
  },
} as const;
