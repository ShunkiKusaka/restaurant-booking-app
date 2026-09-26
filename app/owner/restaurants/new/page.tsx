import { auth } from "../../../../auth.ts";
import { redirect } from "next/navigation";
import RestaurantForm from "./RestaurantForm.tsx";

export default async function NewRestaurantPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }
  if (session.user.role !== "owner") {
    redirect("/");
  }

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-sm">
        <h1 className="text-xl font-bold text-gray-900 mb-6">店舗を登録</h1>
        <RestaurantForm />
      </div>
    </main>
  );
}
