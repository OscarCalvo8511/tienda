import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/features/auth/api";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { signOutAction } from "@/features/auth/actions";
import { LogOut } from "lucide-react";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentProfile().catch(() => null);
  if (!profile) redirect("/login?redirect=/admin");
  if (profile.role !== "admin") redirect("/");

  return (
    <div className="flex min-h-dvh bg-muted/20">
      {/* Sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r bg-card lg:flex">
        <div className="flex h-16 items-center border-b px-5">
          <Link href="/admin" className="text-lg font-bold tracking-tight">
            Tienda · Admin
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto">
          <AdminSidebar />
        </div>
        <div className="border-t p-3">
          <p className="truncate px-3 py-1 text-xs text-muted-foreground">
            {profile.email}
          </p>
          <form action={signOutAction}>
            <button className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground">
              <LogOut className="size-4" /> Cerrar sesión
            </button>
          </form>
        </div>
      </aside>

      {/* Contenido */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-16 items-center gap-3 border-b bg-card/95 px-5 backdrop-blur lg:hidden">
          <Link href="/admin" className="font-bold">Admin</Link>
        </header>
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
