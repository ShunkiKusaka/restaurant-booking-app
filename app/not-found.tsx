import Link from "next/link";
import { PageContainer, ui } from "./components/ui.tsx";

export default function NotFound() {
  return (
    <PageContainer width="narrow">
      <div className={`${ui.card} p-8 text-center`}>
        <p className="tabular text-4xl font-bold text-muted">404</p>
        <h1 className="mt-2 text-lg font-bold text-ink">ページが見つかりません</h1>
        <p className="mt-2 text-sm text-muted">
          URLが間違っているか、お店の公開が終了した可能性があります。
        </p>
        <Link href="/" className={`${ui.btnPrimary} mt-6`}>お店一覧へ</Link>
      </div>
    </PageContainer>
  );
}
