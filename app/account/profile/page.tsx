import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ProfileEditor } from "@/components/a3lam/ProfileEditor";
import { getCurrentUser } from "@/lib/user/auth";
import { getProfileForUser } from "@/lib/user/profileRepository";
import { personService } from "@/lib/services/personService";

export const metadata: Metadata = {
  title: "تحرير الملف المهني",
  description: "أنشئ أو حدّث ملفك المهني في أعلام.",
  robots: { index: false, follow: false },
};

export default async function AccountProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/account/profile");
  const [profile, categories] = await Promise.all([getProfileForUser(user.id), personService.listCategories()]);
  return <main className="account-page"><div className="account-shell"><ProfileEditor profile={profile} categories={categories} /></div></main>;
}
