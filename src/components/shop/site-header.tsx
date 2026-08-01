import Link from "next/link";
import { Menu } from "lucide-react";
import { getCategoryTree } from "@/features/categories/api";
import { getCurrentProfile } from "@/features/auth/api";
import { getSettings } from "@/features/settings/api";
import { CartButton } from "./cart-button";
import { SearchBar } from "./search-bar";
import { AccountMenu } from "./account-menu";
import { CategoryMegaNav } from "./category-nav";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export async function SiteHeader() {
  const [tree, profile, settings] = await Promise.all([
    getCategoryTree().catch(() => []),
    getCurrentProfile().catch(() => null),
    getSettings(),
  ]);

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4">
        {/* Menú móvil */}
        <Sheet>
          <SheetTrigger className="grid size-10 place-items-center rounded-md hover:bg-accent lg:hidden">
            <Menu className="size-5" />
          </SheetTrigger>
          <SheetContent side="left" className="w-80">
            <SheetHeader>
              <SheetTitle>{settings.store.name}</SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col gap-1 px-2">
              {tree.map((cat) => (
                <div key={cat.id} className="py-1">
                  <Link
                    href={`/productos?categoria=${cat.slug}`}
                    className="block rounded-md px-3 py-2 font-medium hover:bg-accent"
                  >
                    {cat.name}
                  </Link>
                  {cat.children.map((child) => (
                    <Link
                      key={child.id}
                      href={`/productos?categoria=${child.slug}`}
                      className="block rounded-md px-6 py-1.5 text-sm text-muted-foreground hover:bg-accent"
                    >
                      {child.name}
                    </Link>
                  ))}
                </div>
              ))}
            </nav>
          </SheetContent>
        </Sheet>

        {/* Logo */}
        <Link href="/" className="shrink-0 text-lg font-bold tracking-tight">
          {settings.store.name}
        </Link>

        {/* Buscador */}
        <div className="hidden flex-1 md:block">
          <SearchBar />
        </div>

        <div className="ml-auto flex items-center gap-1">
          <AccountMenu
            email={profile?.email ?? null}
            isAdmin={profile?.role === "admin"}
          />
          <CartButton />
        </div>
      </div>

      {/* Buscador móvil */}
      <div className="border-t px-4 py-2 md:hidden">
        <SearchBar />
      </div>

      {/* Navegación de categorías (desktop) */}
      <CategoryMegaNav tree={tree} />
    </header>
  );
}
