import { SiteHeader } from "@/components/shop/site-header";
import { SiteFooter } from "@/components/shop/site-footer";
import { AnnouncementBar } from "@/components/shop/announcement-bar";
import { AnalyticsTracker } from "@/components/shop/analytics-tracker";
import { getSettings } from "@/features/settings/api";

export default async function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getSettings();

  return (
    <div className="flex min-h-dvh flex-col">
      <AnalyticsTracker />
      <AnnouncementBar threshold={settings.shipping.free_threshold} />
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
