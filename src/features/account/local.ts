import "server-only";
import { db, mutate, uid, verifyPassword, hashPassword } from "@/lib/local/store";
import type { Address } from "@/types/database.types";
import type { ProductWithImage } from "@/features/products/api";

export function updateProfileLocal(
  userId: string,
  data: { full_name?: string; phone?: string },
) {
  mutate((d) => {
    const u = d.users.find((x) => x.id === userId);
    if (!u) return;
    if (data.full_name != null) u.full_name = data.full_name;
    if (data.phone != null) u.phone = data.phone;
  });
}

export function changePasswordLocal(
  userId: string,
  current: string,
  next: string,
): { ok: boolean; error?: string } {
  const u = db().users.find((x) => x.id === userId);
  if (!u) return { ok: false, error: "Usuario no encontrado" };
  if (!verifyPassword(current, u.password_hash))
    return { ok: false, error: "La contraseña actual no es correcta" };
  mutate((d) => {
    const user = d.users.find((x) => x.id === userId);
    if (user) user.password_hash = hashPassword(next);
  });
  return { ok: true };
}

export function listAddressesLocal(userId: string): Address[] {
  return db()
    .addresses.filter((a) => a.user_id === userId)
    .sort((a, b) => Number(b.is_default) - Number(a.is_default));
}

export interface AddressInput {
  full_name: string;
  phone: string;
  line1: string;
  line2?: string | null;
  city: string;
  department: string;
  country?: string;
  is_default?: boolean;
}

export function saveAddressLocal(
  userId: string,
  input: AddressInput,
  id?: string,
): Address {
  return mutate((d) => {
    if (input.is_default) {
      d.addresses.forEach((a) => {
        if (a.user_id === userId) a.is_default = false;
      });
    }
    if (id) {
      const existing = d.addresses.find((a) => a.id === id && a.user_id === userId);
      if (existing) {
        Object.assign(existing, {
          full_name: input.full_name,
          phone: input.phone,
          line1: input.line1,
          line2: input.line2 ?? null,
          city: input.city,
          department: input.department,
          country: input.country ?? "Colombia",
          is_default: input.is_default ?? existing.is_default,
        });
        return existing;
      }
    }
    const address: Address = {
      id: uid("addr"),
      user_id: userId,
      full_name: input.full_name,
      phone: input.phone,
      line1: input.line1,
      line2: input.line2 ?? null,
      city: input.city,
      department: input.department,
      country: input.country ?? "Colombia",
      postal_code: null,
      is_default: input.is_default ?? d.addresses.filter((a) => a.user_id === userId).length === 0,
      created_at: new Date().toISOString(),
    };
    d.addresses.push(address);
    return address;
  });
}

export function deleteAddressLocal(userId: string, id: string) {
  mutate((d) => {
    d.addresses = d.addresses.filter(
      (a) => !(a.id === id && a.user_id === userId),
    );
  });
}

export interface ReorderLine {
  productId: string;
  slug: string;
  name: string;
  image: string | null;
  price: number;
  compareAt: number | null;
  quantity: number;
  maxStock: number;
}

/** Reconstruye líneas de carrito a partir de un pedido (repetir compra). */
export function getReorderLinesLocal(
  userId: string,
  orderNumber: string,
): ReorderLine[] {
  const d = db();
  const order = d.orders.find(
    (o) => o.order_number === orderNumber && o.user_id === userId,
  );
  if (!order) return [];
  const items = d.order_items.filter((i) => i.order_id === order.id);
  const lines: ReorderLine[] = [];
  for (const it of items) {
    const p = d.products.find((x) => x.id === it.product_id && x.is_active);
    if (!p) continue;
    const inv = d.inventory.find((i) => i.product_id === p.id);
    const img =
      d.product_images.find((i) => i.product_id === p.id && i.is_primary) ??
      d.product_images.find((i) => i.product_id === p.id);
    const price = p.sale_price && p.sale_price < p.price ? p.sale_price : p.price;
    lines.push({
      productId: p.id,
      slug: p.slug,
      name: p.name,
      image: img?.url ?? null,
      price,
      compareAt: p.sale_price ? p.price : null,
      quantity: it.quantity,
      maxStock: inv?.quantity ?? 0,
    });
  }
  return lines;
}

/** Productos por ids (para la lista de favoritos). */
export function getProductsByIdsLocal(ids: string[]): ProductWithImage[] {
  if (!ids.length) return [];
  const d = db();
  return d.products
    .filter((p) => ids.includes(p.id) && p.is_active)
    .map((p) => {
      const imgs = d.product_images
        .filter((i) => i.product_id === p.id)
        .map((i) => ({
          url: i.url,
          alt: i.alt,
          is_primary: i.is_primary,
          position: i.position,
        }));
      const cat = d.categories.find((c) => c.id === p.category_id);
      return {
        ...p,
        product_images: imgs,
        categories: cat ? { name: cat.name, slug: cat.slug } : null,
      };
    });
}
