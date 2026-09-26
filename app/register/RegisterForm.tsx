"use client";

import Link from "next/link";
import { useActionState } from "react";
import { registerUser, type RegisterState } from "../register-action.ts";
import { ui } from "../components/ui.tsx";

const initialState: RegisterState = {};

export default function RegisterForm() {
  const [state, formAction, pending] = useActionState(registerUser, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="name" className={ui.label}>名前</label>
        <input
          id="name"
          type="text"
          name="name"
          required
          maxLength={50}
          autoComplete="name"
          className={ui.input}
        />
      </div>

      <div>
        <label htmlFor="email" className={ui.label}>メールアドレス</label>
        <input
          id="email"
          type="email"
          name="email"
          required
          autoComplete="email"
          className={ui.input}
        />
      </div>

      <div>
        <label htmlFor="password" className={ui.label}>
          パスワード(8文字以上)
        </label>
        <input
          id="password"
          type="password"
          name="password"
          required
          minLength={8}
          autoComplete="new-password"
          className={ui.input}
        />
      </div>

      <div>
        <label htmlFor="role" className={ui.label}>アカウント種別</label>
        <select
          id="role"
          name="role"
          className={ui.input}
        >
          <option value="customer">一般ユーザー(予約する側)</option>
          <option value="owner">店舗オーナー</option>
        </select>
      </div>

      {state.error && (
        <p role="alert" className="text-sm text-danger">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className={`${ui.btnPrimary} w-full`}
      >
        {pending ? "登録しています…" : "登録する"}
      </button>

      <p className="text-sm text-muted text-center">
        すでにアカウントをお持ちの方は{" "}
        <Link href="/login" className="text-ink underline">ログイン</Link>
      </p>
    </form>
  );
}
