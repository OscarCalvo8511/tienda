"use client";

import { useState } from "react";
import { Star, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createReviewAction } from "@/features/reviews/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

function RatingInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="Calificación">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          aria-label={`${i} estrella${i > 1 ? "s" : ""}`}
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(i)}
          className="p-0.5"
        >
          <Star
            className={cn(
              "size-6 transition-colors",
              i <= (hover || value)
                ? "fill-warning text-warning"
                : "fill-muted text-muted",
            )}
          />
        </button>
      ))}
    </div>
  );
}

export function ReviewForm({ productId }: { productId: string }) {
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating < 1) {
      toast.error("Elige una calificación");
      return;
    }
    setSubmitting(true);
    const res = await createReviewAction({
      productId,
      rating,
      title: title.trim() || undefined,
      comment: comment.trim(),
    });
    setSubmitting(false);
    if (res.ok) {
      setDone(true);
      setRating(0);
      setTitle("");
      setComment("");
      toast.success("¡Gracias! Tu reseña quedó pendiente de aprobación.");
    } else {
      toast.error(res.error);
    }
  }

  if (done) {
    return (
      <div className="rounded-xl border border-dashed p-5 text-sm text-muted-foreground">
        Recibimos tu reseña. La publicaremos apenas sea aprobada. ¡Gracias por tu opinión!
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-xl border p-5">
      <h3 className="font-semibold">Escribe tu reseña</h3>
      <div className="space-y-1.5">
        <Label>Tu calificación</Label>
        <RatingInput value={rating} onChange={setRating} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="review-title">Título (opcional)</Label>
        <Input
          id="review-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={120}
          placeholder="Resume tu experiencia"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="review-comment">Tu opinión</Label>
        <Textarea
          id="review-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          required
          maxLength={1000}
          rows={4}
          placeholder="Cuéntanos qué te pareció el producto"
        />
      </div>
      <Button type="submit" disabled={submitting}>
        {submitting && <Loader2 className="size-4 animate-spin" />}
        Enviar reseña
      </Button>
    </form>
  );
}
