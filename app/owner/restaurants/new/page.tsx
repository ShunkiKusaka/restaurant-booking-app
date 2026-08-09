import { auth } from "../../../../auth.ts";
import { redirect } from "next/navigation";
import { createRestaurant } from "../../restaurant-actions.ts";

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

        <form action={createRestaurant} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">店舗名</label>
            <input
              type="text"
              name="name"
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">紹介文</label>
            <textarea
              name="description"
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">住所</label>
            <input
              type="text"
              name="address"
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">電話番号</label>
            <input
              type="text"
              name="phoneNumber"
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">席数</label>
            <input
              type="number"
              name="seatCount"
              min={1}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-gray-900 py-2 text-sm font-medium text-white hover:bg-gray-700 transition-colors"
          >
            登録する(審査待ちになります)
          </button>
        </form>
      </div>
    </main>
  );
}