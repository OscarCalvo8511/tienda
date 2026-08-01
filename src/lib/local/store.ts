import "server-only";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import type {
  Category,
  Product,
  ProductImage,
  Inventory,
  InventoryMovement,
  Order,
  OrderItem,
  OrderStatusHistory,
  Coupon,
  Review,
  Address,
  UserRole,
} from "@/types/database.types";
import {
  seedCategories,
  seedProducts,
  seedImages,
  seedInventory,
  seedCoupons,
  seedSettings,
} from "./seed";

export interface LocalUser {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  role: UserRole;
  is_blocked: boolean;
  password_hash: string;
  created_at: string;
}

export interface LocalSession {
  token: string;
  user_id: string;
  created_at: string;
}

interface LocalDB {
  categories: Category[];
  products: Product[];
  product_images: ProductImage[];
  inventory: Inventory[];
  inventory_movements: InventoryMovement[];
  orders: Order[];
  order_items: OrderItem[];
  order_status_history: OrderStatusHistory[];
  coupons: Coupon[];
  reviews: Review[];
  addresses: Address[];
  users: LocalUser[];
  sessions: LocalSession[];
  settings: typeof seedSettings;
  order_seq: number;
}

const DATA_DIR = path.join(process.cwd(), ".data");
const DB_FILE = path.join(DATA_DIR, "store.json");

export function hashPassword(pw: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(pw, salt, 32).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(pw: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = crypto.scryptSync(pw, salt, 32).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(candidate));
}

function initialDB(): LocalDB {
  return {
    categories: structuredClone(seedCategories),
    products: structuredClone(seedProducts),
    product_images: structuredClone(seedImages),
    inventory: structuredClone(seedInventory),
    inventory_movements: [],
    orders: [],
    order_items: [],
    order_status_history: [],
    coupons: structuredClone(seedCoupons),
    reviews: [],
    addresses: [],
    users: [
      {
        id: "user-admin",
        email: "admin@tienda.co",
        full_name: "Administrador",
        phone: null,
        role: "admin",
        is_blocked: false,
        password_hash: hashPassword("admin123"),
        created_at: new Date().toISOString(),
      },
      {
        id: "user-cliente",
        email: "cliente@tienda.co",
        full_name: "Cliente Demo",
        phone: null,
        role: "customer",
        is_blocked: false,
        password_hash: hashPassword("cliente123"),
        created_at: new Date().toISOString(),
      },
    ],
    sessions: [],
    settings: structuredClone(seedSettings),
    order_seq: 1000,
  };
}

let cache: LocalDB | null = null;

function load(): LocalDB {
  if (cache) return cache;
  try {
    if (fs.existsSync(DB_FILE)) {
      cache = JSON.parse(fs.readFileSync(DB_FILE, "utf8")) as LocalDB;
      return cache;
    }
  } catch {
    /* archivo corrupto → re-seed */
  }
  cache = initialDB();
  persist();
  return cache;
}

function persist() {
  if (!cache) return;
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(DB_FILE, JSON.stringify(cache, null, 2), "utf8");
  } catch (e) {
    console.error("[local-store] no se pudo escribir el archivo:", e);
  }
}

/** Acceso de lectura a la base local. */
export function db(): LocalDB {
  return load();
}

/** Ejecuta una mutación y persiste. */
export function mutate<T>(fn: (db: LocalDB) => T): T {
  const database = load();
  const result = fn(database);
  persist();
  return result;
}

export function uid(prefix = "id"): string {
  return `${prefix}-${crypto.randomUUID()}`;
}
