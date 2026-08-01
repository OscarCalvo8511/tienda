import type { Metadata } from "next";
import { getCurrentProfile } from "@/features/auth/api";
import { ProfileForms } from "@/components/shop/profile-forms";

export const metadata: Metadata = { title: "Mi perfil" };
export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const profile = await getCurrentProfile();
  return (
    <ProfileForms
      fullName={profile?.full_name ?? ""}
      phone={profile?.phone ?? ""}
      email={profile?.email ?? ""}
    />
  );
}
