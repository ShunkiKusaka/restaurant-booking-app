import Link from "next/link";
import { requireOwner } from "../../../../lib/owner.ts";
import { PageContainer, ui } from "../../../components/ui.tsx";
import RestaurantForm from "./RestaurantForm.tsx";

export default async function NewRestaurantPage() {
  await requireOwner();

  return (
    <PageContainer width="narrow">
      <Link href="/owner/dashboard" className="text-sm text-muted hover:text-ink">← 店舗管理</Link>
      <h1 className="mt-3 mb-6 text-2xl font-bold text-ink">店舗を登録</h1>
      <div className={`${ui.card} p-6`}>
        <RestaurantForm />
      </div>
    </PageContainer>
  );
}
