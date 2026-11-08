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

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          phone: string | null;
          role: UserRole;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          phone?: string | null;
          role?: UserRole;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          phone?: string | null;
          role?: UserRole;
          created_at?: string;
          updated_at?: string;
        };
      };
      materials: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          price_per_sqm: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          price_per_sqm: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          price_per_sqm?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      designs: {
        Row: {
          id: string;
          customer_id: string;
          original_file_path: string;
          preview_file_path: string | null;
          file_type: string;
          editor_config: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          original_file_path: string;
          preview_file_path?: string | null;
          file_type: string;
          editor_config?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          customer_id?: string;
          original_file_path?: string;
          preview_file_path?: string | null;
          file_type?: string;
          editor_config?: Json;
          created_at?: string;
        };
      };
      orders: {
        Row: {
          id: string;
          customer_id: string;
          material_id: string;
          design_id: string | null;
          width_cm: number;
          height_cm: number;
          area_sqm: number;
          quantity: number;
          unit_price_snapshot: number;
          total_price: number;
          status: OrderStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          material_id: string;
          design_id?: string | null;
          width_cm: number;
          height_cm: number;
          area_sqm: number;
          quantity: number;
          unit_price_snapshot: number;
          total_price: number;
          status?: OrderStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          customer_id?: string;
          material_id?: string;
          design_id?: string | null;
          width_cm?: number;
          height_cm?: number;
          area_sqm?: number;
          quantity?: number;
          unit_price_snapshot?: number;
          total_price?: number;
          status?: OrderStatus;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}

