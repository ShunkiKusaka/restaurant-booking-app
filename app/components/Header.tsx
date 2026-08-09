"use client";

import { signOut, useSession } from "next-auth/react";
import Link from "next/link";

export default function Header() {
  const { data: session } = useSession();

  return (
    <header className="border-b border-gray-200 bg-white px-6 py-4">
      <div className="mx-auto max-w-4xl flex items-center justify-between">
        <Link href="/" className="font-bold text-gray-900">
          飲食店予約
        </Link>

        <div className="flex items-center gap-4 text-sm">
          {session?.user ? (
            <>
              <span className="text-gray-500">
                {session.user.name} さん({session.user.role})
              </span>
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
            <Link href="/login" className="text-gray-700 hover:underline">
              ログイン
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}