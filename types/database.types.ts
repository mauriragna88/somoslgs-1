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
          subscription_tier: 'gratis' | 'emprendedor' | 'pro' | 'avanzado'
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
          facebook_url: string | null
          instagram_url: string | null
          tiktok_url: string | null
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
          subscription_tier?: 'gratis' | 'emprendedor' | 'pro' | 'avanzado'
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
          facebook_url?: string | null
          instagram_url?: string | null
          tiktok_url?: string | null
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
          subscription_tier?: 'gratis' | 'emprendedor' | 'pro' | 'avanzado'
          subscription_status?: 'active' | 'inactive' | 'suspended'
          business_hours?: Json | null
          is_active?: boolean
          accepts_delivery?: boolean
          accepts_online_payment?: boolean
          facebook_url?: string | null
          instagram_url?: string | null
          tiktok_url?: string | null
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
          type: 'producto' | 'servicio'
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
          type?: 'producto' | 'servicio'
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
          type?: 'producto' | 'servicio'
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
      events: {
        Row: {
          id: string
          name: string
          month_code: string
          dates: string
          description: string
          category: string
          category_color: string
          image_src: string
          image_alt: string
          is_upcoming: boolean
          col_span: string
          row_span: string
          display_order: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          month_code: string
          dates: string
          description: string
          category: string
          category_color?: string
          image_src: string
          image_alt: string
          is_upcoming?: boolean
          col_span?: string
          row_span?: string
          display_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          month_code?: string
          dates?: string
          description?: string
          category?: string
          category_color?: string
          image_src?: string
          image_alt?: string
          is_upcoming?: boolean
          col_span?: string
          row_span?: string
          display_order?: number
          is_active?: boolean
          updated_at?: string
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

// Marketplace types
export interface MarketplaceCategory {
  id: string
  name: string
  icon: string | null
  slug: string
  display_order: number
  created_at: string
}

export interface MarketplaceListing {
  id: string
  seller_id: string
  title: string
  description: string | null
  price: number
  price_type: 'fijo' | 'negociable' | 'gratis' | 'intercambio'
  condition: 'nuevo' | 'seminuevo' | 'usado'
  category_id: string | null
  images: string[]
  location: string | null
  whatsapp: string
  status: 'active' | 'sold' | 'reserved' | 'expired' | 'removed'
  is_featured: boolean
  featured_until: string | null
  views: number
  expires_at: string | null
  created_at: string
  updated_at: string
  // Joined fields
  category?: MarketplaceCategory | null
  seller?: { full_name: string; created_at: string } | null
}

export interface Report {
  id: string
  reporter_id: string
  item_type: 'marketplace_listing' | 'review' | 'business'
  item_id: string
  reason: 'spam' | 'fraude' | 'contenido_inapropiado' | 'articulo_prohibido' | 'otro'
  details: string | null
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed'
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
}

// Marketplace lead type
export interface MarketplaceLead {
  id: string
  listing_id: string
  buyer_id: string
  message: string | null
  created_at: string
  // Joined fields
  buyer?: { full_name: string; phone: string | null } | null
}

// Blog post type
export interface BlogPost {
  id: string
  author_id: string | null
  title: string
  slug: string
  excerpt: string | null
  content: string
  featured_image_url: string | null
  category: string
  tags: string[] | null
  status: 'draft' | 'published'
  published_at: string | null
  view_count: number
  is_featured: boolean
  created_at: string
  updated_at: string
}

// Business photo type
export interface BusinessPhoto {
  id: string
  business_id: string
  image_url: string
  storage_path: string
  display_order: number
  created_at: string
}

export interface SiteEvent {
  id: string
  name: string
  month_code: string
  dates: string
  description: string
  category: string
  category_color: string
  image_src: string
  image_alt: string
  is_upcoming: boolean
  col_span: string
  row_span: string
  display_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}
