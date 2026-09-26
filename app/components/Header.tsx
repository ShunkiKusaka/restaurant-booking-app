"use client";

import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { ROLE_LABELS, label } from "../../lib/labels.ts";

export default function Header() {
  const { data: session } = useSession();

  return (
    <header className="border-b border-gray-200 bg-white px-6 py-4">
      <div className="mx-auto max-w-4xl flex items-center justify-between gap-4">
        <Link href="/" className="font-bold text-gray-900">
          飲食店予約
        </Link>

        <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-1 text-sm">
          {session?.user ? (
            <>
              <span className="text-gray-500">
                {session.user.name} さん({label(ROLE_LABELS, session.user.role)})
              </span>
              {session.user.role === "customer" && (
                <Link href="/reservations" className="text-gray-700 hover:underline">
                  予約履歴
                </Link>
              )}
              {session.user.role === "owner" && (
                <Link href="/owner/dashboard" className="text-gray-700 hover:underline">
                  店舗管理
                </Link>
              )}
              {session.user.role === "admin" && (
                <Link href="/admin/dashboard" className="text-gray-700 hover:underline">
                  運営管理
                </Link>
              )}
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="text-gray-500 hover:text-gray-900"
              >
                ログアウト
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-gray-700 hover:underline">
                ログイン
              </Link>
              <Link href="/register" className="text-gray-700 hover:underline">
                会員登録
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}