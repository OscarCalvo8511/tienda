"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  approveReviewAction,
  deleteReviewAction,
} from "@/features/reviews/actions";
import { RatingStars } from "@/components/shop/rating-stars";
import { Button } from "@/components/ui/button";
import type { PendingReview } from "@/features/reviews/api";

export function ReviewsModeration({ pending }: { pending: PendingReview[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function run(
    id: string,
    fn: (id: string) => Promise<unknown>,
    okMsg: string,
  ) {
    setBusy(id);
    try {
      await fn(id);
      toast.success(okMsg);
      router.refresh();
    } catch {
      toast.error("No se pudo completar la acción");
    } finally {
      setBusy(null);
    }
  }

  if (pending.length === 0) {
    return (
      <div className="rounded-xl border border-dashed py-16 text-center text-sm text-muted-foreground">
        No hay reseñas pendientes de aprobación.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {pending.map((r) => (
        <div key={r.id} className="rounded-xl border p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <span className="font-medium">{r.authorName}</span>
              <RatingStars value={r.rating} size={14} />
            </div>
            <span className="text-xs text-muted-foreground">
              en {r.productName}
            </span>
          </div>
          {r.title && <p className="mt-2 font-semibold">{r.title}</p>}
          {r.comment && (
            <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">
              {r.comment}
            </p>
          )}
          <div className="mt-3 flex gap-2">
            <Button
              size="sm"
              disabled={busy === r.id}
              onClick={() =>
                run(r.id, approveReviewAction, "Reseña publicada")
              }
            >
              {busy === r.id ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Check className="size-4" />
              )}
              Aprobar
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={busy === r.id}
              onClick={() => run(r.id, deleteReviewAction, "Reseña eliminada")}
            >
              <Trash2 className="size-4" />
              Eliminar
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
