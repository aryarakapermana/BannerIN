export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "customer" | "admin";

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "completed"
  | "cancelled";

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.18";
  };
  public: {
    Tables: {
      designs: {
        Row: {
          created_at: string;
          customer_id: string;
          editor_config: Json;
          file_type: string;
          id: string;
          original_file_path: string;
          preview_file_path: string | null;
        };
        Insert: {
          created_at?: string;
          customer_id: string;
          editor_config?: Json;
          file_type: string;
          id?: string;
          original_file_path: string;
          preview_file_path?: string | null;
        };
        Update: {
          created_at?: string;
          customer_id?: string;
          editor_config?: Json;
          file_type?: string;
          id?: string;
          original_file_path?: string;
          preview_file_path?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "designs_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      materials: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          is_active: boolean;
          name: string;
          price_per_sqm: number;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          name: string;
          price_per_sqm: number;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          name?: string;
          price_per_sqm?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      orders: {
        Row: {
          area_sqm: number;
          created_at: string;
          customer_id: string;
          design_id: string | null;
          height_cm: number;
          id: string;
          material_id: string;
          quantity: number;
          status: OrderStatus;
          total_price: number;
          unit_price_snapshot: number;
          updated_at: string;
          width_cm: number;
        };
        Insert: {
          area_sqm: number;
          created_at?: string;
          customer_id: string;
          design_id?: string | null;
          height_cm: number;
          id?: string;
          material_id: string;
          quantity: number;
          status?: OrderStatus;
          total_price: number;
          unit_price_snapshot: number;
          updated_at?: string;
          width_cm: number;
        };
        Update: {
          area_sqm?: number;
          created_at?: string;
          customer_id?: string;
          design_id?: string | null;
          height_cm?: number;
          id?: string;
          material_id?: string;
          quantity?: number;
          status?: OrderStatus;
          total_price?: number;
          unit_price_snapshot?: number;
          updated_at?: string;
          width_cm?: number;
        };
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "orders_design_id_fkey";
            columns: ["design_id"];
            isOneToOne: false;
            referencedRelation: "designs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "orders_material_id_fkey";
            columns: ["material_id"];
            isOneToOne: false;
            referencedRelation: "materials";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          full_name: string | null;
          id: string;
          phone: string | null;
          role: UserRole;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          full_name?: string | null;
          id: string;
          phone?: string | null;
          role?: UserRole;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          full_name?: string | null;
          id?: string;
          phone?: string | null;
          role?: UserRole;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      is_admin: { Args: never; Returns: boolean };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
