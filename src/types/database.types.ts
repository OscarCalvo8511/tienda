/**
 * Tipos de la base de datos.
 * Hechos a mano para reflejar el esquema `tienda` (aplicado vía MCP).
 * El e-commerce vive en el esquema `tienda`, no en `public` (ese esquema
 * lo ocupa otra app). Por eso la clave del tipo Database es `tienda`
 * y los clientes usan `db: { schema: "tienda" }`.
 * Regenerar con: supabase gen types typescript --project-id ydcdhphsrphglewfmbwl --schema tienda
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "customer" | "admin";
export type ProductStatus = "available" | "out_of_stock" | "coming_soon";
export type OrderStatus =
  | "pending"
  | "paid"
  | "preparing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "returned";
export type PaymentStatus = "pending" | "approved" | "failed" | "refunded";
export type PaymentProvider =
  | "stripe"
  | "mercadopago"
  | "paypal"
  | "wompi"
  | "payu"
  | "manual";
export type InventoryMovementType =
  | "in"
  | "out"
  | "adjustment"
  | "sale"
  | "return";
export type CouponType = "percentage" | "fixed" | "free_shipping";
export type NotificationType =
  | "welcome"
  | "order_created"
  | "payment_approved"
  | "order_shipped"
  | "order_delivered"
  | "password_reset"
  | "low_stock";

type Timestamps = { created_at: string };

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: UserRole;
  is_blocked: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  parent_id: string | null;
  position: number;
  is_active: boolean;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  barcode: string | null;
  brand: string | null;
  supplier: string | null;
  short_description: string | null;
  description: string | null;
  specifications: Json;
  price: number;
  sale_price: number | null;
  cost: number | null;
  currency: string;
  weight_grams: number | null;
  length_cm: number | null;
  width_cm: number | null;
  height_cm: number | null;
  status: ProductStatus;
  is_active: boolean;
  is_featured: boolean;
  is_carousel?: boolean;
  category_id: string | null;
  video_url: string | null;
  rating_avg: number;
  rating_count: number;
  sold_count: number;
  created_at: string;
  updated_at: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  url: string;
  alt: string | null;
  is_primary: boolean;
  position: number;
  created_at: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  name: string;
  sku: string | null;
  price: number | null;
  attributes: Json;
  is_active: boolean;
  created_at: string;
}

export interface Inventory {
  id: string;
  product_id: string;
  variant_id: string | null;
  quantity: number;
  low_stock_threshold: number;
  updated_at: string;
}

export interface InventoryMovement {
  id: string;
  product_id: string;
  variant_id: string | null;
  type: InventoryMovementType;
  quantity: number;
  previous_qty: number | null;
  new_qty: number | null;
  reason: string | null;
  created_by: string | null;
  created_at: string;
}

export interface Address {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  department: string;
  country: string;
  postal_code: string | null;
  is_default: boolean;
  created_at: string;
}

export interface Cart {
  id: string;
  user_id: string | null;
  session_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  id: string;
  cart_id: string;
  product_id: string;
  variant_id: string | null;
  quantity: number;
  unit_price: number;
  created_at: string;
}

export interface Wishlist {
  id: string;
  user_id: string;
  created_at: string;
}

export interface WishlistItem {
  id: string;
  wishlist_id: string;
  product_id: string;
  created_at: string;
}

export interface Coupon {
  id: string;
  code: string;
  description: string | null;
  type: CouponType;
  value: number;
  min_purchase: number;
  max_uses: number | null;
  uses_count: number;
  max_uses_per_user: number | null;
  starts_at: string | null;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  user_id: string | null;
  status: OrderStatus;
  subtotal: number;
  discount_total: number;
  shipping_total: number;
  tax_total: number;
  total: number;
  currency: string;
  coupon_id: string | null;
  shipping_method: string | null;
  shipping_address: Json;
  customer_email: string | null;
  customer_phone: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  variant_id: string | null;
  product_name: string;
  sku: string | null;
  unit_price: number;
  quantity: number;
  line_total: number;
  created_at: string;
}

export interface OrderStatusHistory {
  id: string;
  order_id: string;
  from_status: OrderStatus | null;
  to_status: OrderStatus;
  note: string | null;
  changed_by: string | null;
  created_at: string;
}

export interface Payment {
  id: string;
  order_id: string;
  provider: PaymentProvider;
  provider_payment_id: string | null;
  status: PaymentStatus;
  amount: number;
  currency: string;
  raw: Json;
  created_at: string;
  updated_at: string;
}

export interface CouponUsage {
  id: string;
  coupon_id: string;
  user_id: string | null;
  order_id: string | null;
  discount_applied: number;
  used_at: string;
}

export interface Review {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  is_approved: boolean;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  data: Json;
  is_read: boolean;
  created_at: string;
}

export interface Setting {
  key: string;
  value: Json;
  updated_at: string;
}

export interface SalesReport {
  report_date: string;
  orders_count: number;
  gross_sales: number;
  net_sales: number;
  items_sold: number;
  new_customers: number;
  created_at: string;
}

export interface AdminAuditLog {
  id: string;
  admin_id: string | null;
  action: string;
  entity: string | null;
  entity_id: string | null;
  meta: Json;
  created_at: string;
}

/** Helper para construir Row/Insert/Update de forma uniforme. */
type Table<Row, Insert = Partial<Row>, Update = Partial<Row>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type Database = {
  tienda: {
    Tables: {
      profiles: Table<Profile>;
      categories: Table<Category>;
      products: Table<Product>;
      product_images: Table<ProductImage>;
      product_variants: Table<ProductVariant>;
      inventory: Table<Inventory>;
      inventory_movements: Table<InventoryMovement>;
      addresses: Table<Address>;
      carts: Table<Cart>;
      cart_items: Table<CartItem>;
      wishlists: Table<Wishlist>;
      wishlist_items: Table<WishlistItem>;
      coupons: Table<Coupon>;
      orders: Table<Order>;
      order_items: Table<OrderItem>;
      order_status_history: Table<OrderStatusHistory>;
      payments: Table<Payment>;
      coupon_usage: Table<CouponUsage>;
      reviews: Table<Review>;
      notifications: Table<Notification>;
      settings: Table<Setting>;
      sales_reports: Table<SalesReport>;
      admin_audit_log: Table<AdminAuditLog>;
    };
    Views: { [_ in never]: never };
    Functions: {
      is_admin: { Args: Record<string, never>; Returns: boolean };
      adjust_inventory: {
        Args: {
          p_product_id: string;
          p_delta: number;
          p_type: InventoryMovementType;
          p_reason?: string;
          p_variant_id?: string;
        };
        Returns: number;
      };
    };
    Enums: {
      user_role: UserRole;
      product_status: ProductStatus;
      order_status: OrderStatus;
      payment_status: PaymentStatus;
      payment_provider: PaymentProvider;
      inventory_movement_type: InventoryMovementType;
      coupon_type: CouponType;
      notification_type: NotificationType;
    };
    CompositeTypes: { [_ in never]: never };
  };
};
