import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-muted/30 px-4 py-12">
      <Link href="/" className="mb-6 text-2xl font-bold tracking-tight">
        Tienda
      </Link>
      <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
        {children}
      </div>
      <p className="mt-6 text-xs text-muted-foreground">
        © {new Date().getFullYear()} Tienda
      </p>
    </div>
  );
}
