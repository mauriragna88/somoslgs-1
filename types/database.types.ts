export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// Tipos para las tablas de la base de datos
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string
          phone: string | null
          role: 'admin' | 'business_owner' | 'customer' | 'delivery'
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name: string
          phone?: string | null
          role?: 'admin' | 'business_owner' | 'customer' | 'delivery'
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          phone?: string | null
          role?: 'admin' | 'business_owner' | 'customer' | 'delivery'
          avatar_url?: string | null
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          slug: string
          icon: string | null
          parent_id: string | null
          display_order: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          icon?: string | null
          parent_id?: string | null
          display_order?: number
          created_at?: string
        }
        Update: {
          name?: string
          slug?: string
          icon?: string | null
          parent_id?: string | null
          display_order?: number
        }
      }
      businesses: {
        Row: {
          id: string
          owner_id: string
          name: string
          slug: string
          category_id: string | null
          description: string | null
          address: string
          neighborhood: string | null
          city: string
          state: string
          postal_code: string | null
          phone: string
          whatsapp: string
          email: string | null
          website: string | null
          latitude: number | null
          longitude: number | null
          logo_url: string | null
          cover_url: string | null
          business_type: 'productos' | 'servicios' | 'ambos'
          subscription_tier: 'gratis' | 'pro' | 'avanzado'
          subscription_status: 'active' | 'inactive' | 'suspended'
          subscription_started_at: string | null
          subscription_expires_at: string | null
          business_hours: Json | null
          rating: number
          total_reviews: number
          total_orders: number
          is_active: boolean
          is_featured: boolean
          accepts_delivery: boolean
          accepts_online_payment: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          name: string
          slug: string
          category_id?: string | null
          description?: string | null
          address: string
          neighborhood?: string | null
          city?: string
          state?: string
          postal_code?: string | null
          phone: string
          whatsapp: string
          email?: string | null
          website?: string | null
          latitude?: number | null
          longitude?: number | null
          logo_url?: string | null
          cover_url?: string | null
          business_type?: 'productos' | 'servicios' | 'ambos'
          subscription_tier?: 'gratis' | 'pro' | 'avanzado'
          subscription_status?: 'active' | 'inactive' | 'suspended'
          subscription_started_at?: string | null
          subscription_expires_at?: string | null
          business_hours?: Json | null
          rating?: number
          total_reviews?: number
          total_orders?: number
          is_active?: boolean
          is_featured?: boolean
          accepts_delivery?: boolean
          accepts_online_payment?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          slug?: string
          category_id?: string | null
          description?: string | null
          address?: string
          neighborhood?: string | null
          phone?: string
          whatsapp?: string
          email?: string | null
          website?: string | null
          logo_url?: string | null
          cover_url?: string | null
          business_type?: 'productos' | 'servicios' | 'ambos'
          subscription_tier?: 'gratis' | 'pro' | 'avanzado'
          subscription_status?: 'active' | 'inactive' | 'suspended'
          business_hours?: Json | null
          is_active?: boolean
          accepts_delivery?: boolean
          accepts_online_payment?: boolean
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: string
          business_id: string
          name: string
          description: string | null
          price: number
          compare_at_price: number | null
          image_url: string | null
          images: Json | null
          stock: number | null
          sku: string | null
          options: Json | null
          category: string | null
          tags: string[] | null
          is_available: boolean
          display_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          name: string
          description?: string | null
          price: number
          compare_at_price?: number | null
          image_url?: string | null
          images?: Json | null
          stock?: number | null
          sku?: string | null
          options?: Json | null
          category?: string | null
          tags?: string[] | null
          is_available?: boolean
          display_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          description?: string | null
          price?: number
          compare_at_price?: number | null
          image_url?: string | null
          images?: Json | null
          stock?: number | null
          sku?: string | null
          options?: Json | null
          category?: string | null
          tags?: string[] | null
          is_available?: boolean
          display_order?: number
          updated_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          order_number: string
          user_id: string | null
          business_id: string
          address_id: string | null
          delivery_id: string | null
          subtotal: number
          delivery_fee: number
          service_fee: number
          discount: number
          total: number
          status: string
          payment_method: string
          payment_status: string
          payment_id: string | null
          delivery_type: string
          estimated_delivery_time: string | null
          notes: string | null
          rejection_reason: string | null
          created_at: string
          confirmed_at: string | null
          completed_at: string | null
          cancelled_at: string | null
        }
        Insert: {
          id?: string
          order_number: string
          user_id?: string | null
          business_id: string
          address_id?: string | null
          delivery_id?: string | null
          subtotal: number
          delivery_fee?: number
          service_fee?: number
          discount?: number
          total: number
          status?: string
          payment_method?: string
          payment_status?: string
          payment_id?: string | null
          delivery_type?: string
          estimated_delivery_time?: string | null
          notes?: string | null
          rejection_reason?: string | null
          created_at?: string
          confirmed_at?: string | null
          completed_at?: string | null
          cancelled_at?: string | null
        }
        Update: {
          status?: string
          payment_status?: string
          estimated_delivery_time?: string | null
          rejection_reason?: string | null
          confirmed_at?: string | null
          completed_at?: string | null
          cancelled_at?: string | null
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string
          product_name: string
          quantity: number
          unit_price: number
          subtotal: number
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          product_id: string
          product_name: string
          quantity: number
          unit_price: number
          subtotal: number
          notes?: string | null
          created_at?: string
        }
        Update: {
          quantity?: number
          notes?: string | null
        }
      }
      order_customers: {
        Row: {
          id: string
          order_id: string
          name: string
          phone: string
          email: string | null
          delivery_address: string | null
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          name: string
          phone: string
          email?: string | null
          delivery_address?: string | null
          created_at?: string
        }
        Update: {
          name?: string
          phone?: string
          email?: string | null
          delivery_address?: string | null
        }
      }
      business_photos: {
        Row: {
          id: string
          business_id: string
          image_url: string
          storage_path: string
          display_order: number
          created_at: string
        }
        Insert: {
          id?: string
          business_id: string
          image_url: string
          storage_path: string
          display_order?: number
          created_at?: string
        }
        Update: {
          image_url?: string
          storage_path?: string
          display_order?: number
        }
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
  }
}

// Banner type for advertising system
export interface Banner {
  id: string
  title: string
  description: string | null
  display_mode: 'image_only' | 'image_text'
  image_url: string
  link_url: string | null
  placement: string
  is_active: boolean
  start_date: string
  end_date: string | null
  impressions: number
  clicks: number
  created_at: string
  updated_at: string
}
