"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function PaginationNav({
  page,
  totalPages,
}: {
  page: number;
  totalPages: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  if (totalPages <= 1) return null;

  function go(p: number) {
    const sp = new URLSearchParams(params);
    sp.set("page", String(p));
    router.push(`${pathname}?${sp.toString()}`);
  }

  return (
    <nav className="mt-8 flex items-center justify-center gap-2">
      <Button
        variant="outline"
        size="sm"
        disabled={page <= 1}
        onClick={() => go(page - 1)}
      >
        <ChevronLeft className="size-4" /> Anterior
      </Button>
      <span className="px-3 text-sm text-muted-foreground">
        Página {page} de {totalPages}
      </span>
      <Button
        variant="outline"
        size="sm"
        disabled={page >= totalPages}
        onClick={() => go(page + 1)}
      >
        Siguiente <ChevronRight className="size-4" />
      </Button>
    </nav>
  );
}
