import { cn, formatCOP, discountPercent } from "@/lib/utils";

export function Price({
  price,
  salePrice,
  className,
  size = "md",
}: {
  price: number;
  salePrice?: number | null;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const onSale = !!salePrice && salePrice > 0 && salePrice < price;
  const current = onSale ? salePrice! : price;
  const pct = discountPercent(price, salePrice);

  const sizes = {
    sm: "text-sm",
    md: "text-lg",
    lg: "text-2xl",
  }[size];

  return (
    <div className={cn("flex flex-wrap items-baseline gap-2", className)}>
      <span className={cn("font-semibold tracking-tight", sizes)}>
        {formatCOP(current)}
      </span>
      {onSale && (
        <>
          <span className="text-sm text-muted-foreground line-through">
            {formatCOP(price)}
          </span>
          <span className="rounded bg-sale/10 px-1.5 py-0.5 text-xs font-semibold text-sale">
            -{pct}%
          </span>
        </>
      )}
    </div>
  );
}
