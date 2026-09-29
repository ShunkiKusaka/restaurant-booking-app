import type { Metadata } from "next";
import Link from "next/link";
import { CONTACT_EMAIL, OPERATOR_NAME, OPERATOR_REPRESENTATIVE, SITE_NAME } from "../../lib/site.ts";
import LegalPage, { LegalSection } from "../components/LegalPage.tsx";

export const metadata: Metadata = { title: `運営者情報|${SITE_NAME}` };

export default function AboutPage() {
  const rows: [string, React.ReactNode][] = [
    ["サイト名", SITE_NAME],
    ["運営者", OPERATOR_NAME],
    ["代表者", OPERATOR_REPRESENTATIVE],
    ["事業内容", "小さなお店向けの、ホームページと予約システムの制作"],
    ["お問い合わせ", CONTACT_EMAIL],
  ];

  return (
    <LegalPage title="運営者情報" showUpdatedAt={false}>
      <dl className="grid grid-cols-[7rem_1fr] border-t border-line">
        {rows.map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="border-b border-line py-3 pr-4 text-muted">{k}</dt>
            <dd className="border-b border-line py-3">{v}</dd>
          </div>
        ))}
      </dl>

      <LegalSection title="このサイトについて">
        <p>
          このサイトは、{OPERATOR_NAME}が制作した飲食店予約システムのサンプル(デモ)です。
          掲載している店舗・予約・口コミはすべて架空のもので、実際に予約することはできません。
        </p>
        <p>
          ログイン画面の「デモ用アカウント」から、お客様・店舗オーナー・運営者のそれぞれの画面を自由にお試しいただけます。
        </p>
      </LegalSection>

      <p className="text-muted">
        <Link href="/terms" className="text-brand underline">利用規約</Link>
        {" ／ "}
        <Link href="/privacy" className="text-brand underline">プライバシーポリシー</Link>
      </p>
    </LegalPage>
  );
}
