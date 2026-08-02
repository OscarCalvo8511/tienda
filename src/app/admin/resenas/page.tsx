import { getPendingReviews } from "@/features/reviews/api";
import { ReviewsModeration } from "@/components/admin/reviews-moderation";

export const dynamic = "force-dynamic";

export default async function AdminReviewsPage() {
  const pending = await getPendingReviews();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reseñas</h1>
        <p className="text-sm text-muted-foreground">
          Aprueba o rechaza las reseñas enviadas por los clientes
        </p>
      </div>
      <ReviewsModeration pending={pending} />
    </div>
  );
}
