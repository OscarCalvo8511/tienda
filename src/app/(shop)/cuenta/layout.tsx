import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/features/auth/api";
import { AccountNav } from "@/components/shop/account-nav";

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentProfile().catch(() => null);
  if (!profile) redirect("/login?redirect=/cuenta");

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Mi cuenta</h1>
      <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
        <aside className="lg:sticky lg:top-20 lg:h-fit">
          <AccountNav />
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
