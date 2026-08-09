"use server";

import { prisma } from "../lib/prisma.ts";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";

export async function registerUser(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const name = formData.get("name") as string;
  const role = formData.get("role") as string;

  // すでに同じメールアドレスのユーザーがいないか確認
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new Error("このメールアドレスはすでに登録されています");
  }

  // パスワードをハッシュ化(暗号化)する
  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      role: role || "customer",
    },
  });

  redirect("/login");
}