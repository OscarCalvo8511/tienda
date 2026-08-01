"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function SearchBar({ className }: { className?: string }) {
  const router = useRouter();
  const [q, setQ] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const term = q.trim();
    if (term) router.push(`/buscar?q=${encodeURIComponent(term)}`);
  }

  return (
    <form onSubmit={submit} className={cn("relative w-full", className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Buscar productos, marcas y más…"
        aria-label="Buscar productos"
        className="h-10 w-full rounded-full border bg-background pl-10 pr-4 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30"
      />
    </form>
  );
}
