"use client";

import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { ROLE_LABELS, label } from "../../lib/labels.ts";

export default function Header() {
  const { data: session } = useSession();
  const role = session?.user?.role;

  return (
    <header className="border-b border-line bg-surface">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-bold text-ink">
          <span aria-hidden="true" className="grid h-7 w-7 place-items-center rounded-md bg-brand text-sm text-white">
            予
          </span>
          飲食店予約
        </Link>

        <nav aria-label="メニュー" className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
          {session?.user ? (
            <>
              {role === "customer" && (
                <Link href="/reservations" className="text-ink hover:text-brand">
                  予約の確認
                </Link>
              )}
              {role === "owner" && (
                <Link href="/owner/dashboard" className="text-ink hover:text-brand">
                  店舗管理
                </Link>
              )}
              {role === "admin" && (
                <Link href="/admin/dashboard" className="text-ink hover:text-brand">
                  運営管理
                </Link>
              )}
              <span className="text-muted">
                {session.user.name} さん
                <span className="ml-1 rounded bg-paper px-1.5 py-0.5 text-xs">
                  {label(ROLE_LABELS, role ?? "")}
                </span>
              </span>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/" })}
                className="text-muted hover:text-ink"
              >
                ログアウト
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-ink hover:text-brand">
                ログイン
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-brand px-3 py-1.5 font-medium text-white hover:bg-brand-dark"
              >
                会員登録
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
