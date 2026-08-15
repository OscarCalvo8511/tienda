/**
 * Sellos de medios de pago aceptados (Wompi: Visa, Mastercard, Amex, Nequi, PSE).
 * Logos dibujados en SVG/CSS para no depender de imágenes externas y verse
 * nítidos. Cada chip tiene fondo claro fijo para que las marcas se lean bien
 * tanto en modo claro como oscuro.
 */

function Chip({
  children,
  label,
  className,
}: {
  children: React.ReactNode;
  label: string;
  className?: string;
}) {
  return (
    <span
      title={label}
      aria-label={label}
      className={`inline-flex h-7 min-w-11 items-center justify-center rounded-md border border-black/10 bg-white px-2 shadow-sm ${className ?? ""}`}
    >
      {children}
    </span>
  );
}

function Visa() {
  return (
    <Chip label="Visa">
      <span className="text-[11px] font-extrabold italic tracking-tight text-[#1a1f71]">
        VISA
      </span>
    </Chip>
  );
}

function Mastercard() {
  return (
    <Chip label="Mastercard">
      <svg viewBox="0 0 40 24" className="h-4" role="img" aria-hidden="true">
        <circle cx="16" cy="12" r="9" fill="#EB001B" />
        <circle cx="24" cy="12" r="9" fill="#F79E1B" />
        <path
          d="M20 5.2a9 9 0 0 1 0 13.6 9 9 0 0 1 0-13.6Z"
          fill="#FF5F00"
        />
      </svg>
    </Chip>
  );
}

function Amex() {
  return (
    <Chip label="American Express">
      <span className="flex h-4 w-9 items-center justify-center rounded-[3px] bg-[#2e77bb] text-[7px] font-bold leading-none text-white">
        AMEX
      </span>
    </Chip>
  );
}

function Nequi() {
  return (
    <Chip label="Nequi">
      <span className="flex h-4 w-9 items-center justify-center rounded-[3px] bg-[#20064b] text-[9px] font-extrabold lowercase leading-none text-[#ff2d78]">
        nequi
      </span>
    </Chip>
  );
}

function Pse() {
  return (
    <Chip label="PSE">
      <span className="text-[11px] font-extrabold leading-none text-[#0e7cc4]">
        PSE
      </span>
    </Chip>
  );
}

function Bancolombia() {
  return (
    <Chip label="Bancolombia" className="bg-[#ffdd00]">
      <span className="text-[8px] font-extrabold leading-none text-black">
        Bancolombia
      </span>
    </Chip>
  );
}

export function PaymentBadges({ className }: { className?: string }) {
  return (
    <div className={className}>
      <p className="mb-1.5 text-xs font-medium text-muted-foreground">
        Paga seguro con
      </p>
      <div className="flex flex-wrap items-center gap-1.5">
        <Visa />
        <Mastercard />
        <Amex />
        <Nequi />
        <Pse />
        <Bancolombia />
      </div>
    </div>
  );
}
