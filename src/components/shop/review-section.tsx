import Link from "next/link";
import { getProductReviews } from "@/features/reviews/api";
import { getCurrentUser } from "@/features/auth/api";
import { RatingStars } from "./rating-stars";
import { ReviewForm } from "./review-form";

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("es-CO", {
      timeZone: "America/Bogota",
      dateStyle: "long",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

export async function ReviewSection({
  productId,
  slug,
  ratingAvg,
  ratingCount,
}: {
  productId: string;
  slug: string;
  ratingAvg: number;
  ratingCount: number;
}) {
  const [reviews, user] = await Promise.all([
    getProductReviews(productId).catch(() => []),
    getCurrentUser().catch(() => null),
  ]);

  return (
    <section className="mt-12">
      <h2 className="mb-4 text-lg font-bold">Reseñas de clientes</h2>

      <div className="grid gap-8 lg:grid-cols-[300px_1fr]">
        {/* Resumen + formulario */}
        <div className="space-y-6">
          <div className="rounded-xl border p-5">
            {ratingCount > 0 ? (
              <div className="flex items-center gap-4">
                <div className="text-4xl font-bold">{ratingAvg.toFixed(1)}</div>
                <div>
                  <RatingStars value={ratingAvg} size={16} />
                  <p className="mt-1 text-sm text-muted-foreground">
                    {ratingCount} {ratingCount === 1 ? "reseña" : "reseñas"}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Aún no hay reseñas. ¡Sé el primero en opinar!
              </p>
            )}
          </div>

          {user ? (
            <ReviewForm productId={productId} />
          ) : (
            <div className="rounded-xl border border-dashed p-5 text-sm text-muted-foreground">
              <Link
                href={`/login?redirect=/producto/${slug}`}
                className="font-medium text-brand hover:underline"
              >
                Inicia sesión
              </Link>{" "}
              para dejar tu reseña.
            </div>
          )}
        </div>

        {/* Lista de reseñas */}
        <div className="space-y-4">
          {reviews.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Todavía no hay reseñas publicadas para este producto.
            </p>
          ) : (
            reviews.map((r) => (
              <article key={r.id} className="rounded-xl border p-5">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium">{r.authorName}</span>
                  <time className="text-xs text-muted-foreground">
                    {formatDate(r.createdAt)}
                  </time>
                </div>
                <div className="mt-1">
                  <RatingStars value={r.rating} size={14} />
                </div>
                {r.title && <p className="mt-2 font-semibold">{r.title}</p>}
                {r.comment && (
                  <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">
                    {r.comment}
                  </p>
                )}
              </article>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
