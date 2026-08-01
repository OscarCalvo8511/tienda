"use client";

import Link from "next/link";
import { User, Package, Heart, LogOut, LayoutDashboard } from "lucide-react";
import { signOutAction } from "@/features/auth/actions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function AccountMenu({
  email,
  isAdmin,
}: {
  email: string | null;
  isAdmin: boolean;
}) {
  if (!email) {
    return (
      <Link
        href="/login"
        className="hidden items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent sm:flex"
      >
        <User className="size-4" />
        Ingresar
      </Link>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="grid size-10 place-items-center rounded-md hover:bg-accent">
        <User className="size-5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="truncate">{email}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {isAdmin && (
          <>
            <DropdownMenuItem asChild>
              <Link href="/admin">
                <LayoutDashboard className="size-4" /> Panel admin
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem asChild>
          <Link href="/cuenta">
            <User className="size-4" /> Mi cuenta
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/cuenta/pedidos">
            <Package className="size-4" /> Mis pedidos
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/cuenta/favoritos">
            <Heart className="size-4" /> Favoritos
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <form action={signOutAction}>
          <button
            type="submit"
            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
          >
            <LogOut className="size-4" /> Cerrar sesión
          </button>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
