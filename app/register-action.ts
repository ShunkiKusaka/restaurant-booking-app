"use server";

import { prisma } from "../lib/prisma.ts";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";

export type RegisterState = { error?: string };

// 会員登録で選べる種別。運営(admin)はここから作れないようにする。
// ブラウザの開発者ツールで選択肢を書き換えられても、サーバー側で弾く。
const ALLOWED_ROLES = ["customer", "owner"] as const;
type AllowedRole = (typeof ALLOWED_ROLES)[number];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function registerUser(
  _prevState: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const roleInput = String(formData.get("role") ?? "customer");

  if (!name || name.length > 50) {
    return { error: "お名前は1〜50文字で入力してください" };
  }
  if (!EMAIL_RE.test(email)) {
    return { error: "メールアドレスの形式が正しくありません" };
  }
  if (password.length < 8 || password.length > 72) {
    return { error: "パスワードは8文字以上で入力してください" };
  }
  if (!ALLOWED_ROLES.includes(roleInput as AllowedRole)) {
    return { error: "アカウント種別が正しくありません" };
  }
  const role = roleInput as AllowedRole;

  // すでに同じメールアドレスのユーザーがいないか確認
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return { error: "このメールアドレスはすでに登録されています" };
  }

  // パスワードをハッシュ化(暗号化)する
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    await prisma.user.create({
      data: { email, password: hashedPassword, name, role },
    });
  } catch (e) {
    // 同時に同じメールで登録された場合など(一意制約の違反)
    if (typeof e === "object" && e !== null && "code" in e && e.code === "P2002") {
      return { error: "このメールアドレスはすでに登録されています" };
    }
    throw e;
  }

  // redirect は try/catch の外で呼ぶ(内部的に例外を使って移動するため)
  redirect("/login?registered=1");
}
