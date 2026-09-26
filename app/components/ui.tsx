// アプリ全体で使う、見た目の部品とクラス名。
import { label, RESERVATION_STATUS_LABELS, RESTAURANT_STATUS_LABELS } from "../../lib/labels.ts";

export const ui = {
  btnPrimary:
    "inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60",
  btnSecondary:
    "inline-flex items-center justify-center gap-2 rounded-lg border border-line bg-surface px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-paper disabled:cursor-not-allowed disabled:opacity-60",
  btnDanger:
    "inline-flex items-center justify-center gap-2 rounded-lg border border-danger/30 bg-surface px-4 py-2.5 text-sm font-medium text-danger transition-colors hover:bg-danger-soft",
  input:
    "w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink placeholder:text-muted/70 focus:border-brand focus:outline-none",
  label: "mb-1.5 block text-sm font-medium text-ink",
  card: "rounded-xl border border-line bg-surface",
  sectionTitle: "text-base font-bold text-ink",
};

export function PageContainer({
  children,
  width = "wide",
}: {
  children: React.ReactNode;
  width?: "narrow" | "medium" | "wide";
}) {
  const max = width === "narrow" ? "max-w-md" : width === "medium" ? "max-w-3xl" : "max-w-5xl";
  return <main className={`mx-auto w-full ${max} px-4 py-8 sm:px-6 sm:py-10`}>{children}</main>;
}

export function Notice({
  tone = "success",
  children,
}: {
  tone?: "success" | "error" | "info";
  children: React.ReactNode;
}) {
  const styles = {
    success: "bg-brand-soft text-brand",
    error: "bg-danger-soft text-danger",
    info: "bg-paper text-muted border border-line",
  }[tone];
  return (
    <p role={tone === "error" ? "alert" : "status"} className={`rounded-lg px-4 py-3 text-sm ${styles}`}>
      {children}
    </p>
  );
}

const RESERVATION_BADGE: Record<string, string> = {
  confirmed: "bg-brand-soft text-brand",
  completed: "bg-paper text-muted border border-line",
  cancelled: "bg-paper text-muted border border-line line-through",
  no_show: "bg-danger-soft text-danger",
};

export function ReservationStatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${RESERVATION_BADGE[status] ?? ""}`}>
      {label(RESERVATION_STATUS_LABELS, status)}
    </span>
  );
}

const RESTAURANT_BADGE: Record<string, string> = {
  pending: "bg-amber-50 text-amber-800",
  approved: "bg-brand-soft text-brand",
  rejected: "bg-paper text-muted border border-line",
};

export function RestaurantStatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${RESTAURANT_BADGE[status] ?? ""}`}>
      {label(RESTAURANT_STATUS_LABELS, status)}
    </span>
  );
}
