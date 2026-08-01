import Link from "next/link";
import type { CategoryTree } from "@/features/categories/api";

export function CategoryMegaNav({ tree }: { tree: CategoryTree[] }) {
  if (!tree.length) return null;
  return (
    <nav className="hidden border-t lg:block">
      <div className="mx-auto flex max-w-7xl items-center gap-1 px-4">
        <Link
          href="/productos"
          className="px-3 py-2.5 text-sm font-medium hover:text-brand"
        >
          Todos
        </Link>
        {tree.map((cat) => (
          <div key={cat.id} className="group relative">
            <Link
              href={`/productos?categoria=${cat.slug}`}
              className="inline-block px-3 py-2.5 text-sm font-medium hover:text-brand"
            >
              {cat.name}
            </Link>
            {cat.children.length > 0 && (
              <div className="invisible absolute left-0 top-full z-50 min-w-48 rounded-lg border bg-popover p-2 opacity-0 shadow-lg transition group-hover:visible group-hover:opacity-100">
                {cat.children.map((child) => (
                  <Link
                    key={child.id}
                    href={`/productos?categoria=${child.slug}`}
                    className="block rounded-md px-3 py-1.5 text-sm hover:bg-accent"
                  >
                    {child.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
        <Link
          href="/productos?oferta=1"
          className="ml-auto px-3 py-2.5 text-sm font-semibold text-sale hover:opacity-80"
        >
          Ofertas
        </Link>
      </div>
    </nav>
  );
}
