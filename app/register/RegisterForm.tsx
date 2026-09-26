"use client";

import Link from "next/link";
import { useActionState } from "react";
import { registerUser, type RegisterState } from "../register-action.ts";

const initialState: RegisterState = {};

export default function RegisterForm() {
  const [state, formAction, pending] = useActionState(registerUser, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm text-gray-600 mb-1">名前</label>
        <input
          id="name"
          type="text"
          name="name"
          required
          maxLength={50}
          autoComplete="name"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm text-gray-600 mb-1">メールアドレス</label>
        <input
          id="email"
          type="email"
          name="email"
          required
          autoComplete="email"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm text-gray-600 mb-1">
          パスワード(8文字以上)
        </label>
        <input
          id="password"
          type="password"
          name="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label htmlFor="role" className="block text-sm text-gray-600 mb-1">アカウント種別</label>
        <select
          id="role"
          name="role"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          <option value="customer">一般ユーザー(予約する側)</option>
          <option value="owner">店舗オーナー</option>
        </select>
      </div>

      {state.error && (
        <p role="alert" className="text-sm text-red-600">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-gray-900 py-2 text-sm font-medium text-white hover:bg-gray-700 transition-colors disabled:opacity-60"
      >
        {pending ? "登録しています…" : "登録する"}
      </button>

      <p className="text-sm text-gray-500 text-center">
        すでにアカウントをお持ちの方は{" "}
        <Link href="/login" className="text-gray-900 underline">ログイン</Link>
      </p>
    </form>
  );
}
