/**
 * Tipos de la base de datos — GENERADOS automáticamente desde Supabase.
 * El e-commerce vive en el esquema `tienda` (no en `public`, ocupado por otra app),
 * por eso la clave del tipo `Database` es `tienda` y los clientes usan
 * `db: { schema: "tienda" }` con el genérico `<Database, "tienda">`.
 *
 * Regenerar tras cambios de esquema:
 *   npx supabase gen types typescript --project-id ydcdhphsrphglewfmbwl --schema tienda > src/types/database.types.ts
 *   (y volver a pegar la sección "Alias de compatibilidad" del final si se pierde).
 */
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
    PostgrestVersion: "14.5"
  }
  tienda: {
    Tables: {
      addresses: {
        Row: {
          city: string
          country: string
          created_at: string
          department: string
          full_name: string
          id: string
          is_default: boolean
          line1: string
          line2: string | null
          phone: string
          postal_code: string | null
          user_id: string
        }
        Insert: {
          city: string
          country?: string
          created_at?: string
          department: string
          full_name: string
          id?: string
          is_default?: boolean
          line1: string
          line2?: string | null
          phone: string
          postal_code?: string | null
          user_id: string
        }
        Update: {
          city?: string
          country?: string
          created_at?: string
          department?: string
          full_name?: string
          id?: string
          is_default?: boolean
          line1?: string
          line2?: string | null
          phone?: string
          postal_code?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "addresses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_audit_log: {
        Row: {
          action: string
          admin_id: string | null
          created_at: string
          entity: string | null
          entity_id: string | null
          id: string
          meta: Json | null
        }
        Insert: {
          action: string
          admin_id?: string | null
          created_at?: string
          entity?: string | null
          entity_id?: string | null
          id?: string
          meta?: Json | null
        }
        Update: {
          action?: string
          admin_id?: string | null
          created_at?: string
          entity?: string | null
          entity_id?: string | null
          id?: string
          meta?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_audit_log_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cart_items: {
        Row: {
          cart_id: string
          created_at: string
          id: string
          product_id: string
          quantity: number
          unit_price: number
          variant_id: string | null
        }
        Insert: {
          cart_id: string
          created_at?: string
          id?: string
          product_id: string
          quantity?: number
          unit_price: number
          variant_id?: string | null
        }
        Update: {
          cart_id?: string
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
          unit_price?: number
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_cart_id_fkey"
            columns: ["cart_id"]
            isOneToOne: false
            referencedRelation: "carts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      carts: {
        Row: {
          created_at: string
          id: string
          session_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          session_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          session_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "carts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          parent_id: string | null
          position: number
          slug: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          parent_id?: string | null
          position?: number
          slug: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          parent_id?: string | null
          position?: number
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      coupon_usage: {
        Row: {
          coupon_id: string
          discount_applied: number
          id: string
          order_id: string | null
          used_at: string
          user_id: string | null
        }
        Insert: {
          coupon_id: string
          discount_applied?: number
          id?: string
          order_id?: string | null
          used_at?: string
          user_id?: string | null
        }
        Update: {
          coupon_id?: string
          discount_applied?: number
          id?: string
          order_id?: string | null
          used_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coupon_usage_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_usage_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_usage_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          code: string
          created_at: string
          description: string | null
          expires_at: string | null
          id: string
          is_active: boolean
          max_uses: number | null
          max_uses_per_user: number | null
          min_purchase: number
          starts_at: string | null
          type: Database["tienda"]["Enums"]["coupon_type"]
          uses_count: number
          value: number
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          max_uses_per_user?: number | null
          min_purchase?: number
          starts_at?: string | null
          type: Database["tienda"]["Enums"]["coupon_type"]
          uses_count?: number
          value?: number
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          max_uses_per_user?: number | null
          min_purchase?: number
          starts_at?: string | null
          type?: Database["tienda"]["Enums"]["coupon_type"]
          uses_count?: number
          value?: number
        }
        Relationships: []
      }
      inventory: {
        Row: {
          id: string
          low_stock_threshold: number
          product_id: string
          quantity: number
          updated_at: string
          variant_id: string | null
        }
        Insert: {
          id?: string
          low_stock_threshold?: number
          product_id: string
          quantity?: number
          updated_at?: string
          variant_id?: string | null
        }
        Update: {
          id?: string
          low_stock_threshold?: number
          product_id?: string
          quantity?: number
          updated_at?: string
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_movements: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          new_qty: number | null
          previous_qty: number | null
          product_id: string
          quantity: number
          reason: string | null
          type: Database["tienda"]["Enums"]["inventory_movement_type"]
          variant_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          new_qty?: number | null
          previous_qty?: number | null
          product_id: string
          quantity: number
          reason?: string | null
          type: Database["tienda"]["Enums"]["inventory_movement_type"]
          variant_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          new_qty?: number | null
          previous_qty?: number | null
          product_id?: string
          quantity?: number
          reason?: string | null
          type?: Database["tienda"]["Enums"]["inventory_movement_type"]
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          data: Json | null
          id: string
          is_read: boolean
          title: string
          type: Database["tienda"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean
          title: string
          type: Database["tienda"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean
          title?: string
          type?: Database["tienda"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          line_total: number
          order_id: string
          product_id: string | null
          product_name: string
          quantity: number
          sku: string | null
          unit_price: number
          variant_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          line_total: number
          order_id: string
          product_id?: string | null
          product_name: string
          quantity: number
          sku?: string | null
          unit_price: number
          variant_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          line_total?: number
          order_id?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          sku?: string | null
          unit_price?: number
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      order_status_history: {
        Row: {
          changed_by: string | null
          created_at: string
          from_status: Database["tienda"]["Enums"]["order_status"] | null
          id: string
          note: string | null
          order_id: string
          to_status: Database["tienda"]["Enums"]["order_status"]
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          from_status?: Database["tienda"]["Enums"]["order_status"] | null
          id?: string
          note?: string | null
          order_id: string
          to_status: Database["tienda"]["Enums"]["order_status"]
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          from_status?: Database["tienda"]["Enums"]["order_status"] | null
          id?: string
          note?: string | null
          order_id?: string
          to_status?: Database["tienda"]["Enums"]["order_status"]
        }
        Relationships: [
          {
            foreignKeyName: "order_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_status_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          coupon_id: string | null
          created_at: string
          currency: string
          customer_email: string | null
          customer_phone: string | null
          discount_total: number
          id: string
          notes: string | null
          order_number: string
          shipping_address: Json | null
          shipping_method: string | null
          shipping_total: number
          status: Database["tienda"]["Enums"]["order_status"]
          subtotal: number
          tax_total: number
          total: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          coupon_id?: string | null
          created_at?: string
          currency?: string
          customer_email?: string | null
          customer_phone?: string | null
          discount_total?: number
          id?: string
          notes?: string | null
          order_number?: string
          shipping_address?: Json | null
          shipping_method?: string | null
          shipping_total?: number
          status?: Database["tienda"]["Enums"]["order_status"]
          subtotal?: number
          tax_total?: number
          total?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          coupon_id?: string | null
          created_at?: string
          currency?: string
          customer_email?: string | null
          customer_phone?: string | null
          discount_total?: number
          id?: string
          notes?: string | null
          order_number?: string
          shipping_address?: Json | null
          shipping_method?: string | null
          shipping_total?: number
          status?: Database["tienda"]["Enums"]["order_status"]
          subtotal?: number
          tax_total?: number
          total?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          order_id: string
          provider: Database["tienda"]["Enums"]["payment_provider"]
          provider_payment_id: string | null
          raw: Json | null
          status: Database["tienda"]["Enums"]["payment_status"]
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          order_id: string
          provider: Database["tienda"]["Enums"]["payment_provider"]
          provider_payment_id?: string | null
          raw?: Json | null
          status?: Database["tienda"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          order_id?: string
          provider?: Database["tienda"]["Enums"]["payment_provider"]
          provider_payment_id?: string | null
          raw?: Json | null
          status?: Database["tienda"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      product_images: {
        Row: {
          alt: string | null
          created_at: string
          id: string
          is_primary: boolean
          position: number
          product_id: string
          url: string
        }
        Insert: {
          alt?: string | null
          created_at?: string
          id?: string
          is_primary?: boolean
          position?: number
          product_id: string
          url: string
        }
        Update: {
          alt?: string | null
          created_at?: string
          id?: string
          is_primary?: boolean
          position?: number
          product_id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          attributes: Json
          created_at: string
          id: string
          is_active: boolean
          name: string
          price: number | null
          product_id: string
          sku: string | null
        }
        Insert: {
          attributes?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          price?: number | null
          product_id: string
          sku?: string | null
        }
        Update: {
          attributes?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          price?: number | null
          product_id?: string
          sku?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          barcode: string | null
          brand: string | null
          category_id: string | null
          cost: number | null
          created_at: string
          currency: string
          description: string | null
          height_cm: number | null
          id: string
          is_active: boolean
          is_carousel: boolean
          is_featured: boolean
          length_cm: number | null
          name: string
          price: number
          rating_avg: number
          rating_count: number
          sale_price: number | null
          short_description: string | null
          sku: string | null
          slug: string
          sold_count: number
          specifications: Json
          status: Database["tienda"]["Enums"]["product_status"]
          supplier: string | null
          updated_at: string
          video_url: string | null
          weight_grams: number | null
          width_cm: number | null
        }
        Insert: {
          barcode?: string | null
          brand?: string | null
          category_id?: string | null
          cost?: number | null
          created_at?: string
          currency?: string
          description?: string | null
          height_cm?: number | null
          id?: string
          is_active?: boolean
          is_carousel?: boolean
          is_featured?: boolean
          length_cm?: number | null
          name: string
          price: number
          rating_avg?: number
          rating_count?: number
          sale_price?: number | null
          short_description?: string | null
          sku?: string | null
          slug: string
          sold_count?: number
          specifications?: Json
          status?: Database["tienda"]["Enums"]["product_status"]
          supplier?: string | null
          updated_at?: string
          video_url?: string | null
          weight_grams?: number | null
          width_cm?: number | null
        }
        Update: {
          barcode?: string | null
          brand?: string | null
          category_id?: string | null
          cost?: number | null
          created_at?: string
          currency?: string
          description?: string | null
          height_cm?: number | null
          id?: string
          is_active?: boolean
          is_carousel?: boolean
          is_featured?: boolean
          length_cm?: number | null
          name?: string
          price?: number
          rating_avg?: number
          rating_count?: number
          sale_price?: number | null
          short_description?: string | null
          sku?: string | null
          slug?: string
          sold_count?: number
          specifications?: Json
          status?: Database["tienda"]["Enums"]["product_status"]
          supplier?: string | null
          updated_at?: string
          video_url?: string | null
          weight_grams?: number | null
          width_cm?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          is_blocked: boolean
          phone: string | null
          role: Database["tienda"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          is_blocked?: boolean
          phone?: string | null
          role?: Database["tienda"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          is_blocked?: boolean
          phone?: string | null
          role?: Database["tienda"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          author_name: string | null
          comment: string | null
          created_at: string
          id: string
          is_approved: boolean
          product_id: string
          rating: number
          title: string | null
          user_id: string | null
        }
        Insert: {
          author_name?: string | null
          comment?: string | null
          created_at?: string
          id?: string
          is_approved?: boolean
          product_id: string
          rating: number
          title?: string | null
          user_id?: string | null
        }
        Update: {
          author_name?: string | null
          comment?: string | null
          created_at?: string
          id?: string
          is_approved?: boolean
          product_id?: string
          rating?: number
          title?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_reports: {
        Row: {
          created_at: string
          gross_sales: number
          items_sold: number
          net_sales: number
          new_customers: number
          orders_count: number
          report_date: string
        }
        Insert: {
          created_at?: string
          gross_sales?: number
          items_sold?: number
          net_sales?: number
          new_customers?: number
          orders_count?: number
          report_date: string
        }
        Update: {
          created_at?: string
          gross_sales?: number
          items_sold?: number
          net_sales?: number
          new_customers?: number
          orders_count?: number
          report_date?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      wishlist_items: {
        Row: {
          created_at: string
          id: string
          product_id: string
          wishlist_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          wishlist_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          wishlist_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlist_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wishlist_items_wishlist_id_fkey"
            columns: ["wishlist_id"]
            isOneToOne: false
            referencedRelation: "wishlists"
            referencedColumns: ["id"]
          },
        ]
      }
      wishlists: {
        Row: {
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlists_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      adjust_inventory: {
        Args: {
          p_delta: number
          p_product_id: string
          p_reason?: string
          p_type: Database["tienda"]["Enums"]["inventory_movement_type"]
          p_variant_id?: string
        }
        Returns: number
      }
      confirm_order_payment: {
        Args: {
          p_amount: number
          p_order_id: string
          p_provider: Database["tienda"]["Enums"]["payment_provider"]
          p_provider_ref: string
        }
        Returns: Database["tienda"]["Enums"]["order_status"]
      }
      fail_order_payment: {
        Args: {
          p_amount: number
          p_new_status?: Database["tienda"]["Enums"]["order_status"]
          p_order_id: string
          p_provider: Database["tienda"]["Enums"]["payment_provider"]
          p_provider_ref: string
        }
        Returns: Database["tienda"]["Enums"]["order_status"]
      }
      is_admin: { Args: never; Returns: boolean }
      register_sale: { Args: { p_order_id: string }; Returns: undefined }
    }
    Enums: {
      coupon_type: "percentage" | "fixed" | "free_shipping"
      inventory_movement_type: "in" | "out" | "adjustment" | "sale" | "return"
      notification_type:
        | "welcome"
        | "order_created"
        | "payment_approved"
        | "order_shipped"
        | "order_delivered"
        | "password_reset"
        | "low_stock"
      order_status:
        | "pending"
        | "paid"
        | "preparing"
        | "shipped"
        | "delivered"
        | "cancelled"
        | "returned"
      payment_provider:
        | "stripe"
        | "mercadopago"
        | "paypal"
        | "wompi"
        | "payu"
        | "manual"
      payment_status: "pending" | "approved" | "failed" | "refunded"
      product_status: "available" | "out_of_stock" | "coming_soon"
      user_role: "customer" | "admin"
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
  tienda: {
    Enums: {
      coupon_type: ["percentage", "fixed", "free_shipping"],
      inventory_movement_type: ["in", "out", "adjustment", "sale", "return"],
      notification_type: [
        "welcome",
        "order_created",
        "payment_approved",
        "order_shipped",
        "order_delivered",
        "password_reset",
        "low_stock",
      ],
      order_status: [
        "pending",
        "paid",
        "preparing",
        "shipped",
        "delivered",
        "cancelled",
        "returned",
      ],
      payment_provider: [
        "stripe",
        "mercadopago",
        "paypal",
        "wompi",
        "payu",
        "manual",
      ],
      payment_status: ["pending", "approved", "failed", "refunded"],
      product_status: ["available", "out_of_stock", "coming_soon"],
      user_role: ["customer", "admin"],
    },
  },
} as const

/* ─────────────────────────────────────────────────────────────────────────
 * Alias de compatibilidad
 * Reexportan las filas (`Row`) y enums con los nombres usados en todo el
 * código (`Product`, `Order`, `OrderStatus`, …). Al derivarlos del `Database`
 * generado, la inferencia estricta de supabase-js funciona (no más `never`)
 * y los imports existentes siguen compilando sin cambios.
 * ───────────────────────────────────────────────────────────────────────── */
type TiendaTables = Database["tienda"]["Tables"];
type TiendaEnums = Database["tienda"]["Enums"];

export type Profile = TiendaTables["profiles"]["Row"];
export type Category = TiendaTables["categories"]["Row"];
export type Product = TiendaTables["products"]["Row"];
export type ProductImage = TiendaTables["product_images"]["Row"];
export type ProductVariant = TiendaTables["product_variants"]["Row"];
export type Inventory = TiendaTables["inventory"]["Row"];
export type InventoryMovement = TiendaTables["inventory_movements"]["Row"];
export type Address = TiendaTables["addresses"]["Row"];
export type Cart = TiendaTables["carts"]["Row"];
export type CartItem = TiendaTables["cart_items"]["Row"];
export type Wishlist = TiendaTables["wishlists"]["Row"];
export type WishlistItem = TiendaTables["wishlist_items"]["Row"];
export type Coupon = TiendaTables["coupons"]["Row"];
export type Order = TiendaTables["orders"]["Row"];
export type OrderItem = TiendaTables["order_items"]["Row"];
export type OrderStatusHistory = TiendaTables["order_status_history"]["Row"];
export type Payment = TiendaTables["payments"]["Row"];
export type CouponUsage = TiendaTables["coupon_usage"]["Row"];
export type Review = TiendaTables["reviews"]["Row"];
export type Notification = TiendaTables["notifications"]["Row"];
export type Setting = TiendaTables["settings"]["Row"];
export type SalesReport = TiendaTables["sales_reports"]["Row"];
export type AdminAuditLog = TiendaTables["admin_audit_log"]["Row"];

export type UserRole = TiendaEnums["user_role"];
export type ProductStatus = TiendaEnums["product_status"];
export type OrderStatus = TiendaEnums["order_status"];
export type PaymentStatus = TiendaEnums["payment_status"];
export type PaymentProvider = TiendaEnums["payment_provider"];
export type InventoryMovementType = TiendaEnums["inventory_movement_type"];
export type CouponType = TiendaEnums["coupon_type"];
export type NotificationType = TiendaEnums["notification_type"];
