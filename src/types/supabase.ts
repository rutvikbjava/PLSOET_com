export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      ai_generation_records: {
        Row: {
          confidence_score: number | null
          created_at: string
          document_context_id: string | null
          document_id: string | null
          generated_workflow: Json
          id: string
          is_validated: boolean
          model_name: string | null
          model_version: string | null
          validated_at: string | null
          validation_status: string | null
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string
          document_context_id?: string | null
          document_id?: string | null
          generated_workflow: Json
          id?: string
          is_validated?: boolean
          model_name?: string | null
          model_version?: string | null
          validated_at?: string | null
          validation_status?: string | null
        }
        Update: {
          confidence_score?: number | null
          created_at?: string
          document_context_id?: string | null
          document_id?: string | null
          generated_workflow?: Json
          id?: string
          is_validated?: boolean
          model_name?: string | null
          model_version?: string | null
          validated_at?: string | null
          validation_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_generation_records_document_context_id_fkey"
            columns: ["document_context_id"]
            isOneToOne: false
            referencedRelation: "document_contexts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_generation_records_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      approvals: {
        Row: {
          approver_id: string
          comments: string | null
          created_at: string
          decision: Database["public"]["Enums"]["approval_decision"]
          document_id: string
          id: string
          metadata: Json | null
          workflow_instance_id: string
          workflow_instance_step_id: string | null
        }
        Insert: {
          approver_id: string
          comments?: string | null
          created_at?: string
          decision: Database["public"]["Enums"]["approval_decision"]
          document_id: string
          id?: string
          metadata?: Json | null
          workflow_instance_id: string
          workflow_instance_step_id?: string | null
        }
        Update: {
          approver_id?: string
          comments?: string | null
          created_at?: string
          decision?: Database["public"]["Enums"]["approval_decision"]
          document_id?: string
          id?: string
          metadata?: Json | null
          workflow_instance_id?: string
          workflow_instance_step_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "approvals_approver_id_fkey"
            columns: ["approver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approvals_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approvals_workflow_instance_id_fkey"
            columns: ["workflow_instance_id"]
            isOneToOne: false
            referencedRelation: "workflow_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approvals_workflow_instance_step_id_fkey"
            columns: ["workflow_instance_step_id"]
            isOneToOne: false
            referencedRelation: "workflow_instance_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_events: {
        Row: {
          actor_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string | null
          event_data: Json | null
          event_type: string
          id: string
          institution_id: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          event_data?: Json | null
          event_type: string
          id?: string
          institution_id: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          event_data?: Json | null
          event_type?: string
          id?: string
          institution_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_events_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          code: string
          created_at: string
          id: string
          institution_id: string
          name: string
          status: Database["public"]["Enums"]["institution_status"]
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          institution_id: string
          name: string
          status?: Database["public"]["Enums"]["institution_status"]
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          institution_id?: string
          name?: string
          status?: Database["public"]["Enums"]["institution_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "departments_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      document_contexts: {
        Row: {
          confidence_score: number | null
          created_at: string
          creator_role_detected: string | null
          department_scope: string | null
          document_id: string
          document_type_detected: string | null
          extracted_attributes: Json | null
          id: string
          impact_level: string | null
          model_version: string | null
          processing_status: Database["public"]["Enums"]["processing_status"]
          purpose: string | null
          updated_at: string
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string
          creator_role_detected?: string | null
          department_scope?: string | null
          document_id: string
          document_type_detected?: string | null
          extracted_attributes?: Json | null
          id?: string
          impact_level?: string | null
          model_version?: string | null
          processing_status?: Database["public"]["Enums"]["processing_status"]
          purpose?: string | null
          updated_at?: string
        }
        Update: {
          confidence_score?: number | null
          created_at?: string
          creator_role_detected?: string | null
          department_scope?: string | null
          document_id?: string
          document_type_detected?: string | null
          extracted_attributes?: Json | null
          id?: string
          impact_level?: string | null
          model_version?: string | null
          processing_status?: Database["public"]["Enums"]["processing_status"]
          purpose?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_contexts_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      document_versions: {
        Row: {
          checksum: string | null
          created_at: string
          document_id: string
          file_size_bytes: number | null
          id: string
          storage_path: string
          uploaded_by: string
          version_number: number
        }
        Insert: {
          checksum?: string | null
          created_at?: string
          document_id: string
          file_size_bytes?: number | null
          id?: string
          storage_path: string
          uploaded_by: string
          version_number: number
        }
        Update: {
          checksum?: string | null
          created_at?: string
          document_id?: string
          file_size_bytes?: number | null
          id?: string
          storage_path?: string
          uploaded_by?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "document_versions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_versions_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          created_at: string
          created_by: string
          department_id: string | null
          description: string | null
          document_type: string
          id: string
          institution_id: string
          status: Database["public"]["Enums"]["document_status"]
          storage_path: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          department_id?: string | null
          description?: string | null
          document_type: string
          id?: string
          institution_id: string
          status?: Database["public"]["Enums"]["document_status"]
          storage_path?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          department_id?: string | null
          description?: string | null
          document_type?: string
          id?: string
          institution_id?: string
          status?: Database["public"]["Enums"]["document_status"]
          storage_path?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      institutions: {
        Row: {
          code: string
          created_at: string
          id: string
          metadata: Json | null
          name: string
          slug: string
          status: Database["public"]["Enums"]["institution_status"]
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          metadata?: Json | null
          name: string
          slug: string
          status?: Database["public"]["Enums"]["institution_status"]
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          name?: string
          slug?: string
          status?: Database["public"]["Enums"]["institution_status"]
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string | null
          notification_type: string
          read_at: string | null
          recipient_id: string
          related_entity_id: string | null
          related_entity_type: string | null
          status: Database["public"]["Enums"]["notification_status"]
          title: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          notification_type: string
          read_at?: string | null
          recipient_id: string
          related_entity_id?: string | null
          related_entity_type?: string | null
          status?: Database["public"]["Enums"]["notification_status"]
          title: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          notification_type?: string
          read_at?: string | null
          recipient_id?: string
          related_entity_id?: string | null
          related_entity_type?: string | null
          status?: Database["public"]["Enums"]["notification_status"]
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      policies: {
        Row: {
          created_at: string
          created_by: string
          department_id: string | null
          description: string | null
          effective_from: string | null
          effective_until: string | null
          id: string
          institution_id: string
          name: string
          policy_rules: Json
          status: Database["public"]["Enums"]["workflow_status"]
          updated_at: string
          version: number
        }
        Insert: {
          created_at?: string
          created_by: string
          department_id?: string | null
          description?: string | null
          effective_from?: string | null
          effective_until?: string | null
          id?: string
          institution_id: string
          name: string
          policy_rules?: Json
          status?: Database["public"]["Enums"]["workflow_status"]
          updated_at?: string
          version?: number
        }
        Update: {
          created_at?: string
          created_by?: string
          department_id?: string | null
          description?: string | null
          effective_from?: string | null
          effective_until?: string | null
          id?: string
          institution_id?: string
          name?: string
          policy_rules?: Json
          status?: Database["public"]["Enums"]["workflow_status"]
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "policies_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "policies_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "policies_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      policy_validation_records: {
        Row: {
          ai_generation_record_id: string | null
          created_at: string
          id: string
          is_compliant: boolean
          policy_id: string | null
          policy_version: number | null
          validation_result: string
          validator_version: string | null
          violations: Json | null
          workflow_definition_id: string | null
        }
        Insert: {
          ai_generation_record_id?: string | null
          created_at?: string
          id?: string
          is_compliant: boolean
          policy_id?: string | null
          policy_version?: number | null
          validation_result: string
          validator_version?: string | null
          violations?: Json | null
          workflow_definition_id?: string | null
        }
        Update: {
          ai_generation_record_id?: string | null
          created_at?: string
          id?: string
          is_compliant?: boolean
          policy_id?: string | null
          policy_version?: number | null
          validation_result?: string
          validator_version?: string | null
          violations?: Json | null
          workflow_definition_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "policy_validation_records_ai_generation_record_id_fkey"
            columns: ["ai_generation_record_id"]
            isOneToOne: false
            referencedRelation: "ai_generation_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "policy_validation_records_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "policies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "policy_validation_records_workflow_definition_id_fkey"
            columns: ["workflow_definition_id"]
            isOneToOne: false
            referencedRelation: "workflow_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          department_id: string | null
          display_name: string
          email: string
          id: string
          institution_id: string
          role: string
          status: Database["public"]["Enums"]["profile_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          department_id?: string | null
          display_name: string
          email: string
          id: string
          institution_id: string
          role?: string
          status?: Database["public"]["Enums"]["profile_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          department_id?: string | null
          display_name?: string
          email?: string
          id?: string
          institution_id?: string
          role?: string
          status?: Database["public"]["Enums"]["profile_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      signatures: {
        Row: {
          approval_id: string | null
          created_at: string
          document_id: string
          id: string
          signature_provider: string | null
          signature_reference: string | null
          signed_at: string | null
          signer_id: string
          status: Database["public"]["Enums"]["signature_status"]
          workflow_instance_id: string
        }
        Insert: {
          approval_id?: string | null
          created_at?: string
          document_id: string
          id?: string
          signature_provider?: string | null
          signature_reference?: string | null
          signed_at?: string | null
          signer_id: string
          status?: Database["public"]["Enums"]["signature_status"]
          workflow_instance_id: string
        }
        Update: {
          approval_id?: string | null
          created_at?: string
          document_id?: string
          id?: string
          signature_provider?: string | null
          signature_reference?: string | null
          signed_at?: string | null
          signer_id?: string
          status?: Database["public"]["Enums"]["signature_status"]
          workflow_instance_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "signatures_approval_id_fkey"
            columns: ["approval_id"]
            isOneToOne: false
            referencedRelation: "approvals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "signatures_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "signatures_signer_id_fkey"
            columns: ["signer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "signatures_workflow_instance_id_fkey"
            columns: ["workflow_instance_id"]
            isOneToOne: false
            referencedRelation: "workflow_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_definitions: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          institution_id: string
          name: string
          status: Database["public"]["Enums"]["workflow_status"]
          updated_at: string
          version: number
          workflow_type: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          institution_id: string
          name: string
          status?: Database["public"]["Enums"]["workflow_status"]
          updated_at?: string
          version?: number
          workflow_type: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          institution_id?: string
          name?: string
          status?: Database["public"]["Enums"]["workflow_status"]
          updated_at?: string
          version?: number
          workflow_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_definitions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_definitions_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_instance_steps: {
        Row: {
          assigned_approver_id: string | null
          comments: string | null
          completed_at: string | null
          created_at: string
          decision: Database["public"]["Enums"]["approval_decision"] | null
          id: string
          sequence_order: number
          started_at: string | null
          status: Database["public"]["Enums"]["workflow_step_status"]
          step_name: string
          workflow_instance_id: string
          workflow_step_id: string | null
        }
        Insert: {
          assigned_approver_id?: string | null
          comments?: string | null
          completed_at?: string | null
          created_at?: string
          decision?: Database["public"]["Enums"]["approval_decision"] | null
          id?: string
          sequence_order: number
          started_at?: string | null
          status?: Database["public"]["Enums"]["workflow_step_status"]
          step_name: string
          workflow_instance_id: string
          workflow_step_id?: string | null
        }
        Update: {
          assigned_approver_id?: string | null
          comments?: string | null
          completed_at?: string | null
          created_at?: string
          decision?: Database["public"]["Enums"]["approval_decision"] | null
          id?: string
          sequence_order?: number
          started_at?: string | null
          status?: Database["public"]["Enums"]["workflow_step_status"]
          step_name?: string
          workflow_instance_id?: string
          workflow_step_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workflow_instance_steps_assigned_approver_id_fkey"
            columns: ["assigned_approver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_instance_steps_workflow_instance_id_fkey"
            columns: ["workflow_instance_id"]
            isOneToOne: false
            referencedRelation: "workflow_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_instance_steps_workflow_step_id_fkey"
            columns: ["workflow_step_id"]
            isOneToOne: false
            referencedRelation: "workflow_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_instances: {
        Row: {
          completed_at: string | null
          created_at: string
          document_id: string
          id: string
          initiated_by: string
          instance_name: string
          institution_id: string
          status: Database["public"]["Enums"]["workflow_instance_status"]
          updated_at: string
          workflow_definition_id: string
          workflow_snapshot: Json
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          document_id: string
          id?: string
          initiated_by: string
          instance_name: string
          institution_id: string
          status?: Database["public"]["Enums"]["workflow_instance_status"]
          updated_at?: string
          workflow_definition_id: string
          workflow_snapshot: Json
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          document_id?: string
          id?: string
          initiated_by?: string
          instance_name?: string
          institution_id?: string
          status?: Database["public"]["Enums"]["workflow_instance_status"]
          updated_at?: string
          workflow_definition_id?: string
          workflow_snapshot?: Json
        }
        Relationships: [
          {
            foreignKeyName: "workflow_instances_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_instances_initiated_by_fkey"
            columns: ["initiated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_instances_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_instances_workflow_definition_id_fkey"
            columns: ["workflow_definition_id"]
            isOneToOne: false
            referencedRelation: "workflow_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_steps: {
        Row: {
          approver_role: string | null
          approver_user_id: string | null
          created_at: string
          department_id: string | null
          id: string
          is_mandatory: boolean
          sequence_order: number
          step_config: Json | null
          step_name: string
          step_type: string
          timeout_hours: number | null
          updated_at: string
          workflow_definition_id: string
        }
        Insert: {
          approver_role?: string | null
          approver_user_id?: string | null
          created_at?: string
          department_id?: string | null
          id?: string
          is_mandatory?: boolean
          sequence_order: number
          step_config?: Json | null
          step_name: string
          step_type: string
          timeout_hours?: number | null
          updated_at?: string
          workflow_definition_id: string
        }
        Update: {
          approver_role?: string | null
          approver_user_id?: string | null
          created_at?: string
          department_id?: string | null
          id?: string
          is_mandatory?: boolean
          sequence_order?: number
          step_config?: Json | null
          step_name?: string
          step_type?: string
          timeout_hours?: number | null
          updated_at?: string
          workflow_definition_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_steps_approver_user_id_fkey"
            columns: ["approver_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_steps_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_steps_workflow_definition_id_fkey"
            columns: ["workflow_definition_id"]
            isOneToOne: false
            referencedRelation: "workflow_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_institution_id: { Args: never; Returns: string }
      get_user_role: { Args: never; Returns: string }
      user_has_institution: { Args: never; Returns: boolean }
      user_is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      approval_decision:
        | "APPROVED"
        | "REJECTED"
        | "RETURNED_FOR_REVISION"
        | "DELEGATED"
      document_status:
        | "DRAFT"
        | "SUBMITTED"
        | "IN_REVIEW"
        | "APPROVED"
        | "REJECTED"
        | "ARCHIVED"
      institution_status: "ACTIVE" | "INACTIVE" | "SUSPENDED"
      notification_status: "UNREAD" | "READ" | "ARCHIVED"
      processing_status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED"
      profile_status:
        | "ACTIVE"
        | "INACTIVE"
        | "SUSPENDED"
        | "PENDING_VERIFICATION"
      signature_status: "PENDING" | "SIGNED" | "FAILED" | "EXPIRED"
      workflow_instance_status:
        | "PENDING"
        | "IN_PROGRESS"
        | "COMPLETED"
        | "REJECTED"
        | "CANCELLED"
      workflow_status: "DRAFT" | "ACTIVE" | "INACTIVE" | "ARCHIVED"
      workflow_step_status:
        | "PENDING"
        | "IN_PROGRESS"
        | "COMPLETED"
        | "SKIPPED"
        | "REJECTED"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      approval_decision: [
        "APPROVED",
        "REJECTED",
        "RETURNED_FOR_REVISION",
        "DELEGATED",
      ],
      document_status: [
        "DRAFT",
        "SUBMITTED",
        "IN_REVIEW",
        "APPROVED",
        "REJECTED",
        "ARCHIVED",
      ],
      institution_status: ["ACTIVE", "INACTIVE", "SUSPENDED"],
      notification_status: ["UNREAD", "READ", "ARCHIVED"],
      processing_status: ["PENDING", "PROCESSING", "COMPLETED", "FAILED"],
      profile_status: [
        "ACTIVE",
        "INACTIVE",
        "SUSPENDED",
        "PENDING_VERIFICATION",
      ],
      signature_status: ["PENDING", "SIGNED", "FAILED", "EXPIRED"],
      workflow_instance_status: [
        "PENDING",
        "IN_PROGRESS",
        "COMPLETED",
        "REJECTED",
        "CANCELLED",
      ],
      workflow_status: ["DRAFT", "ACTIVE", "INACTIVE", "ARCHIVED"],
      workflow_step_status: [
        "PENDING",
        "IN_PROGRESS",
        "COMPLETED",
        "SKIPPED",
        "REJECTED",
      ],
    },
  },
} as const

