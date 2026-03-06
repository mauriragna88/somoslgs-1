// Basic database types for Supabase queries
// This provides typing for common operations without full type generation

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      [key: string]: {
        Row: Record<string, any>
        Insert: Record<string, any>
        Update: Record<string, any>
      }
    }
    Views: {
      [key: string]: {
        Row: Record<string, any>
      }
    }
    Functions: {
      [key: string]: {
        Args: Record<string, any>
        Returns: any
      }
    }
    Enums: {
      [key: string]: string
    }
  }
}

// Common entity types for easier use throughout the app
export interface Profile {
  id: string
  email: string
  full_name: string
  phone: string | null
  avatar_url: string | null
  role: 'admin' | 'business_owner' | 'customer' | 'delivery'
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  name: string
  slug: string
  icon: string
  description: string | null
  is_active: boolean
}

export interface Business {
  id: string
  owner_id: string
  name: string
  slug: string
  category_id: string | null
  description: string | null
  logo_url: string | null
  cover_image_url: string | null
  address: string
  neighborhood: string | null
  latitude: number | null
  longitude: number | null
  phone: string
  whatsapp: string | null
  email: string | null
  website: string | null
  facebook_url: string | null
  instagram_url: string | null
  business_type: 'productos' | 'servicios' | 'ambos'
  subscription_tier: 'gratis' | 'emprendedor' | 'pro' | 'avanzado'
  subscription_status: 'active' | 'suspended' | 'expired'
  subscription_started_at: string | null
  subscription_expires_at: string | null
  is_active: boolean
  is_verified: boolean
  created_at: string
  updated_at: string
  category?: Category | null
}

export interface Product {
  id: string
  business_id: string
  name: string
  slug: string
  description: string | null
  price: number
  compare_at_price: number | null
  category_id: string | null
  images: string[] | null
  is_active: boolean
  stock: number | null
  created_at: string
  updated_at: string
}

export interface Order {
  id: string
  order_number: string
  user_id: string | null
  business_id: string
  subtotal: number
  delivery_fee: number
  service_fee: number
  discount: number
  total: number
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivering' | 'completed' | 'cancelled'
  payment_method: 'cash' | 'card' | 'transfer'
  payment_status: 'pending' | 'pending_verification' | 'verified' | 'completed' | 'failed'
  payment_id: string | null
  delivery_type: 'pickup' | 'delivery'
  notes: string | null
  created_at: string
  confirmed_at: string | null
  completed_at: string | null
  cancelled_at: string | null
  rejection_reason: string | null
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string | null
  product_name: string
  quantity: number
  unit_price: number
  subtotal: number
}

export interface OrderCustomer {
  id: string
  order_id: string
  name: string
  phone: string
  email: string | null
  delivery_address: string | null
}

export interface BusinessPhoto {
  id: string
  business_id: string
  image_url: string
  storage_path: string
  display_order: number
  created_at: string
}

export interface Transaction {
  id: string
  business_id: string
  user_id: string
  amount: number
  subscription_tier: string
  subscription_months: number
  payment_method: string
  status: 'pending' | 'awaiting_proof' | 'approved' | 'rejected'
  proof_url: string | null
  proof_notes: string | null
  approved_by: string | null
  approved_at: string | null
  rejection_reason: string | null
  created_at: string
  updated_at: string
}
