import Link from "next/link";
import { getSettings } from "@/features/settings/api";

export async function SiteFooter() {
  const { store } = await getSettings();
  return (
    <footer className="mt-16 border-t bg-muted/30">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <h3 className="text-lg font-bold">{store.name}</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Tu tienda en línea con envíos a todo Colombia y pagos seguros.
          </p>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">Comprar</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link href="/productos" className="hover:text-foreground">Todos los productos</Link></li>
            <li><Link href="/productos?oferta=1" className="hover:text-foreground">Ofertas</Link></li>
            <li><Link href="/productos?categoria=electronica" className="hover:text-foreground">Electrónica</Link></li>
            <li><Link href="/productos?categoria=ropa" className="hover:text-foreground">Ropa</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">Mi cuenta</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link href="/cuenta" className="hover:text-foreground">Perfil</Link></li>
            <li><Link href="/cuenta/pedidos" className="hover:text-foreground">Mis pedidos</Link></li>
            <li><Link href="/cuenta/favoritos" className="hover:text-foreground">Favoritos</Link></li>
            <li><Link href="/login" className="hover:text-foreground">Ingresar</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">Contacto</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>{store.contact_email}</li>
            <li>{store.contact_phone}</li>
          </ul>
        </div>
      </div>
      <div className="border-t py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {store.name}. Todos los derechos reservados.
      </div>
    </footer>
  );
}
