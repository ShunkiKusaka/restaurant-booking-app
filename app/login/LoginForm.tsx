"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ui } from "../components/ui.tsx";

// デモ用アカウント(prisma/seed.ts で作成)。誰でもログインして試せるように、あえて公開している。
const DEMO_ACCOUNTS = [
  { role: "customer", label: "お客さんとして試す", email: "customer@example.com" },
  { role: "owner", label: "店舗オーナーとして試す", email: "owner@example.com" },
  { role: "admin", label: "運営として試す", email: "admin@example.com" },
];
const DEMO_PASSWORD = "password123";

/** ログイン後に戻る先。自分のサイト内のパスだけ許可する(外部サイトへの誘導を防ぐ) */
function safeCallback(url: string | undefined): string | null {
  if (!url || !url.startsWith("/") || url.startsWith("//")) return null;
  return url;
}

export default function LoginForm({
  registered,
  callbackUrl,
}: {
  registered: boolean;
  callbackUrl?: string;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const login = async (email: string, password: string) => {
    setError("");
    setPending(true);
    try {
      const result = await signIn("credentials", { email, password, redirect: false });
      if (!result || result.error) {
        setError("メールアドレスまたはパスワードが間違っています");
        return;
      }

      // ログイン後、最新のセッション情報を取得してroleを確認する
      const sessionRes = await fetch("/api/auth/session");
      const session = await sessionRes.json();
      const role = session?.user?.role;
      const back = safeCallback(callbackUrl);

      if (role === "owner") {
        router.push("/owner/dashboard");
      } else if (role === "admin") {
        router.push("/admin/dashboard");
      } else {
        router.push(back ?? "/");
      }
      router.refresh();
    } catch {
      setError("ログインできませんでした。時間をおいて、もう一度お試しください");
    } finally {
      setPending(false);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    login(
      String(formData.get("email") ?? "").trim().toLowerCase(),
      String(formData.get("password") ?? "")
    );
  };

  return (
    <>
      {registered && (
        <p role="status" className="mb-4 rounded-lg bg-brand-soft px-3 py-2 text-sm text-brand">
          登録しました。メールアドレスとパスワードでログインしてください。
        </p>
      )}
      {callbackUrl && !registered && (
        <p role="status" className="mb-4 rounded-lg bg-paper px-3 py-2 text-sm text-muted">
          予約を続けるには、ログインしてください。
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className={ui.label}>メールアドレス</label>
          <input id="email" type="email" name="email" required autoComplete="email" className={ui.input} />
        </div>

        <div>
          <label htmlFor="password" className={ui.label}>パスワード</label>
          <input
            id="password"
            type="password"
            name="password"
            required
            autoComplete="current-password"
            className={ui.input}
          />
        </div>

        {error && (
          <p role="alert" className="text-sm text-danger">{error}</p>
        )}

        <button type="submit" disabled={pending} className={`${ui.btnPrimary} w-full`}>
          {pending ? "ログインしています…" : "ログイン"}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-muted">
        アカウントをお持ちでない方は{" "}
        <Link href="/register" className="text-ink underline">会員登録</Link>
      </p>

      <div className="mt-8 border-t border-line pt-6">
        <p className="text-sm font-medium text-ink">デモ用アカウントで試す</p>
        <p className="mt-1 text-xs text-muted">登録しなくても、それぞれの立場の画面を確認できます。</p>
        <div className="mt-3 grid gap-2">
          {DEMO_ACCOUNTS.map((a) => (
            <button
              key={a.role}
              type="button"
              disabled={pending}
              onClick={() => login(a.email, DEMO_PASSWORD)}
              className={ui.btnSecondary}
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
