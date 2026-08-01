"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { saveProductAction } from "@/features/admin/actions";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/env";
import type { ProductInput } from "@/features/admin/products";
import type { Category, Product, ProductImage } from "@/types/database.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

export function ProductForm({
  categories,
  product,
  images,
  stock,
}: {
  categories: Category[];
  product?: Product;
  images?: ProductImage[];
  stock?: number;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isActive, setIsActive] = useState(product?.is_active ?? true);
  const [isFeatured, setIsFeatured] = useState(product?.is_featured ?? false);
  const [isCarousel, setIsCarousel] = useState(product?.is_carousel ?? false);
  const [imagesText, setImagesText] = useState(
    images?.map((i) => i.url).join("\n") ?? "",
  );

  async function onFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = ""; // permite volver a subir el mismo archivo
    if (files.length === 0) return;
    if (!isSupabaseConfigured()) {
      toast.error("La subida de imágenes requiere Supabase configurado");
      return;
    }
    setUploading(true);
    const supabase = createClient();
    const urls: string[] = [];
    for (const file of files) {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage
        .from("productos")
        .upload(path, file, { cacheControl: "3600", upsert: false });
      if (error) {
        toast.error(`No se pudo subir ${file.name}: ${error.message}`);
        continue;
      }
      const { data } = supabase.storage.from("productos").getPublicUrl(path);
      urls.push(data.publicUrl);
    }
    setUploading(false);
    if (urls.length) {
      setImagesText((prev) => [prev.trim(), ...urls].filter(Boolean).join("\n"));
      toast.success(`${urls.length} imagen(es) subida(s)`);
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const num = (k: string) => {
      const v = fd.get(k);
      return v ? Number(v) : null;
    };

    const specsRaw = String(fd.get("specifications") ?? "").trim();
    let specifications: Record<string, string> = {};
    specsRaw.split("\n").forEach((line) => {
      const [k, ...rest] = line.split(":");
      if (k && rest.length) specifications[k.trim()] = rest.join(":").trim();
    });

    const input: ProductInput = {
      name: String(fd.get("name")),
      sku: String(fd.get("sku") ?? "") || null,
      barcode: String(fd.get("barcode") ?? "") || null,
      brand: String(fd.get("brand") ?? "") || null,
      supplier: String(fd.get("supplier") ?? "") || null,
      short_description: String(fd.get("short_description") ?? "") || null,
      description: String(fd.get("description") ?? "") || null,
      price: num("price") ?? 0,
      sale_price: num("sale_price"),
      cost: num("cost"),
      weight_grams: num("weight_grams"),
      category_id: String(fd.get("category_id") ?? "") || null,
      status: String(fd.get("status") ?? "available") as Product["status"],
      is_active: isActive,
      is_featured: isFeatured,
      is_carousel: isCarousel,
      video_url: String(fd.get("video_url") ?? "") || null,
      specifications,
      stock: num("stock") ?? 0,
      images: imagesText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
    };

    if (!input.name || input.price <= 0) {
      toast.error("Nombre y precio son obligatorios");
      return;
    }

    setSaving(true);
    const res = await saveProductAction(input, product?.id);
    setSaving(false);
    if (res.ok) {
      toast.success(product ? "Producto actualizado" : "Producto creado");
      router.push("/admin/productos");
      router.refresh();
    }
  }

  const specsText = product
    ? Object.entries((product.specifications ?? {}) as Record<string, string>)
        .map(([k, v]) => `${k}: ${v}`)
        .join("\n")
    : "";

  return (
    <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        <Card title="Información general">
          <Field label="Nombre *" name="name" defaultValue={product?.name} required />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Marca" name="brand" defaultValue={product?.brand ?? ""} />
            <Field label="Proveedor" name="supplier" defaultValue={product?.supplier ?? ""} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="short_description">Descripción corta</Label>
            <Textarea id="short_description" name="short_description" rows={2} defaultValue={product?.short_description ?? ""} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">Descripción larga</Label>
            <Textarea id="description" name="description" rows={5} defaultValue={product?.description ?? ""} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="specifications">Especificaciones (una por línea: Clave: Valor)</Label>
            <Textarea id="specifications" name="specifications" rows={4} defaultValue={specsText} placeholder={"Pantalla: 6.7\"\nRAM: 8GB"} />
          </div>
        </Card>

        <Card title="Precios">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Precio normal *" name="price" type="number" defaultValue={product?.price} required />
            <Field label="Precio oferta" name="sale_price" type="number" defaultValue={product?.sale_price ?? ""} />
            <Field label="Costo" name="cost" type="number" defaultValue={product?.cost ?? ""} />
          </div>
        </Card>

        <Card title="Identificación y logística">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="SKU" name="sku" defaultValue={product?.sku ?? ""} />
            <Field label="Código de barras" name="barcode" defaultValue={product?.barcode ?? ""} />
            <Field label="Peso (g)" name="weight_grams" type="number" defaultValue={product?.weight_grams ?? ""} />
            <Field label="Video (URL)" name="video_url" defaultValue={product?.video_url ?? ""} />
          </div>
        </Card>

        <Card title="Imágenes (la primera es la principal)">
          <div className="flex flex-wrap items-center gap-3">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-dashed px-3 py-2 text-sm font-medium hover:bg-accent">
              {uploading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Upload className="size-4" />
              )}
              {uploading ? "Subiendo…" : "Subir imágenes"}
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={onFilesSelected}
                disabled={uploading}
              />
            </label>
            <span className="text-xs text-muted-foreground">
              Se guardan en tu Supabase Storage. También puedes pegar URLs abajo.
            </span>
          </div>
          <Textarea
            name="images"
            rows={4}
            value={imagesText}
            onChange={(e) => setImagesText(e.target.value)}
            placeholder="https://…/imagen1.jpg"
          />
        </Card>
      </div>

      <div className="space-y-6">
        <Card title="Organización">
          <div className="space-y-1.5">
            <Label htmlFor="category_id">Categoría</Label>
            <select
              id="category_id"
              name="category_id"
              defaultValue={product?.category_id ?? ""}
              className="h-9 w-full rounded-md border bg-background px-3 text-sm"
            >
              <option value="">Sin categoría</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.parent_id ? "— " : ""}{c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="status">Estado</Label>
            <select
              id="status"
              name="status"
              defaultValue={product?.status ?? "available"}
              className="h-9 w-full rounded-md border bg-background px-3 text-sm"
            >
              <option value="available">Disponible</option>
              <option value="out_of_stock">Agotado</option>
              <option value="coming_soon">Próximamente</option>
            </select>
          </div>
          <Field label="Stock" name="stock" type="number" defaultValue={stock ?? 0} />
          <label className="flex items-center justify-between text-sm">
            Activo (visible)
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </label>
          <label className="flex items-center justify-between text-sm">
            Destacado
            <Switch checked={isFeatured} onCheckedChange={setIsFeatured} />
          </label>
          <label className="flex items-center justify-between text-sm">
            <span>
              Destacado de la semana
              <span className="block text-xs font-normal text-muted-foreground">
                Aparece en el carrusel de la portada
              </span>
            </span>
            <Switch checked={isCarousel} onCheckedChange={setIsCarousel} />
          </label>
        </Card>

        <Button type="submit" className="w-full" disabled={saving}>
          {saving && <Loader2 className="size-4 animate-spin" />}
          {product ? "Guardar cambios" : "Crear producto"}
        </Button>
      </div>
    </form>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4 rounded-xl border bg-card p-5">
      <h2 className="text-sm font-semibold">{title}</h2>
      {children}
    </div>
  );
}

function Field({
  label,
  name,
  ...props
}: { label: string; name: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} {...props} />
    </div>
  );
}
