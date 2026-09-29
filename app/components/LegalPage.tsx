// プライバシーポリシー・利用規約・運営者情報で使う、読み物ページの枠と見出し
import { LEGAL_UPDATED_AT } from "../../lib/site.ts";
import { PageContainer } from "./ui.tsx";

export default function LegalPage({
  title,
  showUpdatedAt = true,
  children,
}: {
  title: string;
  showUpdatedAt?: boolean;
  children: React.ReactNode;
}) {
  return (
    <PageContainer width="medium">
      <article className="rounded-lg border border-line bg-surface px-5 py-8 sm:px-10">
        <h1 className="font-display text-2xl text-ink sm:text-3xl">{title}</h1>
        {showUpdatedAt && <p className="mt-2 text-xs text-muted">制定日:{LEGAL_UPDATED_AT}</p>}
        <div className="mt-8 space-y-8 text-sm leading-7 text-ink">{children}</div>
      </article>
    </PageContainer>
  );
}

/** 条文や項目の見出しと本文 */
export function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 border-b border-line pb-1 text-base font-bold text-ink">{title}</h2>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

/** 箇条書き */
export function LegalList({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="list-disc space-y-1 pl-5">
      {items.map((item, i) => <li key={i}>{item}</li>)}
    </ul>
  );
}
